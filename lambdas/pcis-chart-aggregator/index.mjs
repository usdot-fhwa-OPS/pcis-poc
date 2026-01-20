import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME =
  process.env.DDB_TABLE_NAME || process.env.DYNAMODB_TABLE || "Container";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);


const INDEXES = {
  BCO_ASSIGNMENTS: "GSI_BCO_Assignments",
  BCO_CONTAINERS: "GSI_BCO_Containers",
  TERMINAL_APPROVALS: "GSI_Terminal_Approvals",
  TERMINAL_STATUS: "GSI_Terminal_Status",
  TRANSOP_DECISIONS: "GSI_TransportationOperator_Decisions",
  TRANSOP_SCHEDULE: "GSI_TransportationOperator_Schedule",
};

// --------------------
// Dynamo helpers
// --------------------
async function queryAllByPK({
  tableName,
  indexName,
  pkName,
  pkValue,
  skName,
  skBeginsWith,
  skBetween,
  filterExpression,
  expressionAttributeNames,
  expressionAttributeValues,
  projectionExpression,
  limit,
}) {
  const items = [];
  let ExclusiveStartKey;

  // Base expression setup
  const EAN = { ...(expressionAttributeNames || {}) };
  const EAV = { ...(expressionAttributeValues || {}) };

  // Always map pk/sk names through EAN to avoid reserved words surprises
  EAN["#pk"] = pkName;
  EAV[":pk"] = pkValue;

  let keyCondition = "#pk = :pk";

  if (skName && skBeginsWith !== undefined && skBeginsWith !== null) {
    EAN["#sk"] = skName;
    EAV[":skPrefix"] = skBeginsWith;
    keyCondition += " AND begins_with(#sk, :skPrefix)";
  } else if (skName && skBetween && skBetween.length === 2) {
    EAN["#sk"] = skName;
    EAV[":skFrom"] = skBetween[0];
    EAV[":skTo"] = skBetween[1];
    keyCondition += " AND #sk BETWEEN :skFrom AND :skTo";
  }

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: Object.keys(EAN).length ? EAN : undefined,
        ExpressionAttributeValues: Object.keys(EAV).length ? EAV : undefined,
        ProjectionExpression: projectionExpression,
        ExclusiveStartKey,
        Limit: limit,
      })
    );

    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

// --------------------
// Auth helpers
// --------------------
function getClaims(event) {
  const authorizer = event?.requestContext?.authorizer;
  // REST API: authorizer.claims
  // HTTP API: authorizer.jwt.claims
  return authorizer?.claims || authorizer?.jwt?.claims || null;
}

function normalizeSpaces(s) {
  return s.replace(/\s+/g, " ").trim();
}

function getRoleNormalized(event) {
  const claims = getClaims(event);
  const raw = claims?.["custom:role"];
  if (!raw) return "";
  return normalizeSpaces(raw.toString().toLowerCase());
}

function isSupportedRole(roleNorm) {
  return (
    roleNorm.includes("terminal") ||
    roleNorm.includes("trucking") ||
    roleNorm.includes("transportation") ||
    roleNorm.includes("cargo owner") || // covers Beneficial Cargo Owner
    roleNorm.includes("rail") ||
    roleNorm.includes("logistics") ||
    roleNorm.includes("3pl")
  );
}

// Prefer claim "email", fall back to cognito:username
function getUserEmail(claims) {
  return (
    claims?.email ||
    claims?.["email"] ||
    claims?.["cognito:username"] ||
    ""
  ).toString();
}

// Destination/terminal routing key for terminal operators.
// You can supply this in any of these ways:
//
// 1) Cognito custom claim (recommended): custom:destination or custom:terminalDestination
// 2) Querystring override (useful for dev): ?destination=NYNJ
// 3) Environment default: DEFAULT_DESTINATION
function getDestination(event, claims) {
  const fromClaims =
    claims?.["custom:destination"] ||
    claims?.["custom:terminalDestination"] ||
    claims?.["custom:terminal"] ||
    "";

  const fromQS = event?.queryStringParameters?.destination || "";
  const fromEnv = process.env.DEFAULT_DESTINATION || "";

  return (fromClaims || fromQS || fromEnv || "").toString().trim();
}

// --------------------
// Role → DynamoDB Query routing
// --------------------
function roleKind(roleNorm) {
  if (roleNorm.includes("terminal")) return "terminal";
  if (roleNorm.includes("cargo owner")) return "bco";
  // Transportation Operator, Trucking Operator, Rail Operator, Third Party Logistics Provider
  if (
    roleNorm.includes("rail") ||
    roleNorm.includes("trucking") ||
    roleNorm.includes("transportation") ||
    roleNorm.includes("logistics") ||
    roleNorm.includes("3pl")
  ) {
    return "transop";
  }
  return "unknown";
}



async function fetchAuthorizedItems(event, claims, roleNorm) {
  const kind = roleKind(roleNorm);

  if (kind === "bco") {
    const bcoEmail =
      (claims?.["custom:bcoEmail"] || getUserEmail(claims)).toString();
    if (!bcoEmail) return [];

    // Use the "containers" index for status distribution + timeline
    return queryAllByPK({
      tableName: TABLE_NAME,
      indexName: INDEXES.BCO_CONTAINERS,
      pkName: "bcoEmail",
      pkValue: bcoEmail,
      skName: "containerStatus",
    });
  }

  if (kind === "terminal") {
    const destination = getDestination(event, claims);
    if (!destination) return [];

    // Terminal operators typically care about:
    // - current container status (Terminal_Status)
    // - approvals/decisions (Terminal_Approvals)
    //
    // We can query one index and derive both distributions in-app, or query both
    // and merge. We'll merge for completeness.
    const [statusItems, approvalItems] = await Promise.all([
      queryAllByPK({
        tableName: TABLE_NAME,
        indexName: INDEXES.TERMINAL_STATUS,
        pkName: "destination",
        pkValue: destination,
        skName: "containerStatus",
      }),
      queryAllByPK({
        tableName: TABLE_NAME,
        indexName: INDEXES.TERMINAL_APPROVALS,
        pkName: "destination",
        pkValue: destination,
        skName: "reservationStatus",
      }),
    ]);

    // Merge unique-ish by containerID/containerId if present, else fallback to JSON stringify
    const seen = new Set();
    const merged = [];

    for (const it of [...statusItems, ...approvalItems]) {
      const id =
        it.containerID ||
        it.containerId ||
        it.pk ||
        it.PK ||
        JSON.stringify(it);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(it);
    }

    return merged;
  }

  if (kind === "transop") {
    const transopEmail =
      (claims?.["custom:transopEmail"] || getUserEmail(claims)).toString();
    if (!transopEmail) return [];

    // Transportation operators care about:
    // - decision status (Decisions)
    // - pickup schedule (Schedule)
    //
    // We'll merge both like terminal did.
    const [decisionItems, scheduleItems] = await Promise.all([
      queryAllByPK({
        tableName: TABLE_NAME,
        indexName: INDEXES.TRANSOP_DECISIONS,
        pkName: "transopEmail",
        pkValue: transopEmail,
        skName: "reservationStatus",
      }),
      queryAllByPK({
        tableName: TABLE_NAME,
        indexName: INDEXES.TRANSOP_SCHEDULE,
        pkName: "transopEmail",
        pkValue: transopEmail,
        skName: "resPickupDate",
      }),
    ]);

    const seen = new Set();
    const merged = [];

    for (const it of [...decisionItems, ...scheduleItems]) {
      const id =
        it.containerID ||
        it.containerId ||
        it.pk ||
        it.PK ||
        JSON.stringify(it);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(it);
    }

    return merged;
  }

  return [];
}

// --------------------
// Aggregation
// --------------------
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
      it.resPickupDate || // prefer explicit pickup date if you have it
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

  // sort upcoming events by soonest first
  upcomingAppointments.sort((a, b) => (a.when < b.when ? -1 : 1));

  return {
    statusDistribution: statusCounts,
    bookingStatusDistribution: bookingCounts,
    reservationStatusDistribution: reservationCounts,
    upcomingEvents: upcomingAppointments,
  };
}

function shapeByRole(roleNorm, agg) {
  // NOTE:
  // Your old code compared against Title Case role strings (e.g., "Terminal Operator"),
  // but your getRoleNormalized() returns lowercase + normalized spaces.
  //
  // So we shape based on keywords.

  if (roleNorm.includes("terminal")) {
    return {
      statusDistribution: agg.statusDistribution,
      approvalQueueSummary: agg.reservationStatusDistribution,
      eventsToday: agg.upcomingEvents.slice(0, 50),
    };
  }

  if (
    roleNorm.includes("trucking") ||
    roleNorm.includes("transportation") ||
    roleNorm.includes("rail") ||
    roleNorm.includes("logistics") ||
    roleNorm.includes("3pl")
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

// --------------------
// Handler
// --------------------
export const handler = async (event) => {
  try {
    const claims = getClaims(event);
    if (!claims) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: "Unauthorized: missing authorizer claims",
        }),
      };
    }

    const roleNorm = getRoleNormalized(event);
    if (!roleNorm) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: "Forbidden: missing custom:role claim",
        }),
      };
    }

    if (!isSupportedRole(roleNorm)) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: "Forbidden: unsupported role",
          role: roleNorm,
        }),
      };
    }

    // Phase 2: query only what the user is authorized to see (via GSIs)
    const items = await fetchAuthorizedItems(event, claims, roleNorm);

    const agg = aggregate(items);
    const data = shapeByRole(roleNorm, agg);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        role: roleNorm,
        // Optional small debugging hints (safe to remove later)
        context: {
          email: getUserEmail(claims) || null,
          destination:
            roleNorm.includes("terminal") ? getDestination(event, claims) : null,
          itemCount: items.length,
        },
        data,
      }),
    };
  } catch (err) {
    console.error("pcis-chart-aggregator error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: err?.message || "Internal server error",
      }),
    };
  }
};
