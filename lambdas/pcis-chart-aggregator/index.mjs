
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME =
  process.env.DDB_TABLE_NAME || process.env.DYNAMODB_TABLE || "Container";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// -------- Dynamo helper --------

async function scanAll(tableName) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    );
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

// -------- Auth helpers --------

function getClaims(event) {
  const authorizer = event?.requestContext?.authorizer;
  // REST API: authorizer.claims
  // HTTP API: authorizer.jwt.claims
  return authorizer?.claims || authorizer?.jwt?.claims || null;
}

function getRole(event) {
  const claims = getClaims(event);
  const raw = claims?.["custom:role"];
  return raw ? raw.toString().trim().toLowerCase() : "";
}

function isSupportedRole(role) {
  return (
    role === "Terminal Operator" ||
    role === "Trucking Operator" ||
    role === "Transportation Operator" ||
    role === "Beneficial Cargo Owner" ||
    role === "Rail Operator"
  );
}

// -------- Aggregation --------

function aggregate(items) {
  const statusCounts = {};
  const bookingCounts = {};
  const reservationCounts = {};
  const upcomingAppointments = [];

  const now = new Date();

  for (const it of items) {
    const containerStatus = it.containerStatus || "unknown";
    statusCounts[containerStatus] = (statusCounts[containerStatus] || 0) + 1;

    const bookingStatus = it.bookingStatus || "unknown";
    bookingCounts[bookingStatus] = (bookingCounts[bookingStatus] || 0) + 1;

    const reservationStatus = it.reservationStatus || "unknown";
    reservationCounts[reservationStatus] =
      (reservationCounts[reservationStatus] || 0) + 1;

    // upcoming events within 72 hours, based on whatever timestamp exists
    const candidateTime =
      it.modifiedReservationDate ||
      it.reservationDate ||
      it.arrivalDate ||
      it.createdAt;

    if (candidateTime) {
      const dt = new Date(candidateTime);
      if (!Number.isNaN(dt.getTime())) {
        const diffHrs = (dt - now) / (1000 * 60 * 60);
        if (diffHrs >= 0 && diffHrs <= 72) {
          upcomingAppointments.push({
            containerID: it.containerID || it.containerId || null,
            when: dt.toISOString(),
            hoursUntil: +diffHrs.toFixed(2),
            containerStatus,
            bookingStatus,
            reservationStatus,
          });
        }
      }
    }
  }

  return {
    statusDistribution: statusCounts,
    bookingStatusDistribution: bookingCounts,
    reservationStatusDistribution: reservationCounts,
    upcomingEvents: upcomingAppointments,
  };
}

function shapeByRole(role, agg) {
  // Keep it simple: role chooses which subsets to return.
  // (Same underlying data right now; you can evolve this later.)

  if (role === "Terminal Operator") {
    return {
      statusDistribution: agg.statusDistribution,
      approvalQueueSummary: agg.reservationStatusDistribution,
      eventsToday: agg.upcomingEvents.slice(0, 50),
    };
  }

  if (
    role === "Trucking Operator" ||
    role === "Transportation Operator" ||
    role === "Rail Operator"
  ) {
    return {
      workloadByStatus: agg.bookingStatusDistribution,
      decisionSummary: agg.reservationStatusDistribution,
      calendarEvents: agg.upcomingEvents.slice(0, 200),
    };
  }

  // beneficial cargo owner
  return {
    cargoStatus: agg.statusDistribution,
    shipmentTimeline: agg.upcomingEvents.slice(0, 200),
    transportationAssignmentSummary: agg.bookingStatusDistribution,
  };
}

// -------- Handler --------

export const handler = async (event) => {
  try {
    const claims = getClaims(event);
    if (!claims) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Unauthorized: missing authorizer claims",
        }),
      };
    }

    const role = getRole(event);
    if (!role) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Forbidden: missing custom:role claim",
        }),
      };
    }

    if (!isSupportedRole(role)) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Forbidden: unsupported role",
          role,
        }),
      };
    }

    // Phase 1: scan everything
    const items = await scanAll(TABLE_NAME);

    const agg = aggregate(items);
    const data = shapeByRole(role, agg);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, role, data }),
    };
  } catch (err) {
    console.error("pcis-chart-aggregator error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: err?.message || "Internal server error",
      }),
    };
  }
};
