import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME =
  process.env.DDB_TABLE_NAME || process.env.DYNAMODB_TABLE || "CargoUnits";
const TERMINAL_CAPACITY_TABLE =
  process.env.TERMINAL_CAPACITY_TABLE || "TerminalCapacity";


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

function unwrapDynamoValue(value) {
  if (Array.isArray(value)) return value.map(unwrapDynamoValue);
  if (!value || typeof value !== "object") return value;

  const keys = Object.keys(value);
  if (keys.length === 1) {
    if ("S" in value) return value.S;
    if ("N" in value) return Number(value.N);
    if ("BOOL" in value) return Boolean(value.BOOL);
    if ("NULL" in value) return null;
    if ("L" in value && Array.isArray(value.L)) return value.L.map(unwrapDynamoValue);
    if ("M" in value && value.M && typeof value.M === "object") {
      return Object.fromEntries(
        Object.entries(value.M).map(([k, v]) => [k, unwrapDynamoValue(v)])
      );
    }
  }

  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, unwrapDynamoValue(v)])
  );
}

function parseDateInput(value) {
  if (!value) return null;
  const text = value.toString().trim();
  if (!text) return null;

  const isoAttempt = new Date(text);
  if (!Number.isNaN(isoAttempt.getTime())) return isoAttempt;

  const usDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDate) {
    const [, month, day, year] = usDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return null;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffInDays(later, earlier) {
  return Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / (1000 * 60 * 60 * 24));
}

function diffInMonths(later, earlier) {
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

function weekdayToNumber(day) {
  const map = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    thrusday: 4, // typo compatibility with existing data
  };
  return map[(day || "").toString().toLowerCase()] ?? null;
}

function matchesNthWeekday(date, weekNumberRaw, dayRaw) {
  const weekNumber = (weekNumberRaw || "").toString().toLowerCase();
  const dayNum = weekdayToNumber(dayRaw);
  if (dayNum === null || date.getDay() !== dayNum) return false;

  const year = date.getFullYear();
  const month = date.getMonth();
  const allDates = [];
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    if (cursor.getDay() === dayNum) allDates.push(cursor.getDate());
    cursor.setDate(cursor.getDate() + 1);
  }

  const currentDate = date.getDate();
  if (weekNumber === "first") return currentDate === allDates[0];
  if (weekNumber === "second") return currentDate === allDates[1];
  if (weekNumber === "third") return currentDate === allDates[2];
  if (weekNumber === "fourth") return currentDate === allDates[3];
  if (weekNumber === "last") return currentDate === allDates[allDates.length - 1];
  return false;
}

function appliesOnDate(record, day) {
  if (!record.isActive || record.capacity <= 0 || !record.startDate) return false;

  const target = startOfDay(day);
  const start = startOfDay(record.startDate);
  const end = record.endDate ? startOfDay(record.endDate) : null;

  if (target < start) return false;
  if (end && target > end) return false;

  const repeat = (record.repeat || "Never").toString().toLowerCase();
  const dayDiff = diffInDays(target, start);
  const weekDiff = Math.floor(dayDiff / 7);
  const monthDiff = diffInMonths(target, start);

  if (!repeat || repeat === "never") return dayDiff === 0;
  if (repeat === "daily") return true;
  if (repeat === "weekdays") return target.getDay() >= 1 && target.getDay() <= 5;
  if (repeat === "weekends") return target.getDay() === 0 || target.getDay() === 6;
  if (repeat === "weekly") return target.getDay() === start.getDay();
  if (repeat === "biweekly") return target.getDay() === start.getDay() && weekDiff % 2 === 0;
  if (repeat === "monthly") return target.getDate() === start.getDate() && monthDiff % 1 === 0;
  if (repeat === "every 3 months") return target.getDate() === start.getDate() && monthDiff % 3 === 0;
  if (repeat === "every 6 months") return target.getDate() === start.getDate() && monthDiff % 6 === 0;
  if (repeat === "yearly") return target.getDate() === start.getDate() && target.getMonth() === start.getMonth();

  if (repeat !== "custom") return true;

  const config = record.repeatConfig || {};
  const frequency = (config.frequency || "").toString().toLowerCase();
  const interval = Number(config.interval || 1) || 1;
  const daysOfWeek = (config.daysOfWeek || [])
    .map((d) => weekdayToNumber(d))
    .filter((d) => d !== null);
  const daysOfMonth = (config.daysOfMonth || [])
    .map((d) => Number(d))
    .filter((d) => Number.isFinite(d));

  if (frequency === "daily") return dayDiff % interval === 0;
  if (frequency === "weekly") {
    const allowedDays = daysOfWeek.length > 0 ? daysOfWeek : [start.getDay()];
    return weekDiff % interval === 0 && allowedDays.includes(target.getDay());
  }
  if (frequency === "monthly") {
    if (monthDiff % interval !== 0) return false;
    if (daysOfMonth.length > 0) return daysOfMonth.includes(target.getDate());
    if (config.weekNumber && config.dayOfWeek) {
      return matchesNthWeekday(target, config.weekNumber, config.dayOfWeek);
    }
    return target.getDate() === start.getDate();
  }
  if (frequency === "yearly") {
    const yearDiff = target.getFullYear() - start.getFullYear();
    if (yearDiff % interval !== 0) return false;

    const monthMap = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const months = (config.months || [])
      .map((m) => monthMap[(m || "").toString().toLowerCase()])
      .filter((m) => Number.isInteger(m));

    if (months.length > 0 && !months.includes(target.getMonth())) return false;
    if (daysOfMonth.length > 0) return daysOfMonth.includes(target.getDate());
    if (config.weekNumber && config.dayOfWeek) {
      return matchesNthWeekday(target, config.weekNumber, config.dayOfWeek);
    }
    return target.getDate() === start.getDate();
  }

  return true;
}

async function fetchTerminalCapacityRecords() {
  const items = [];
  let ExclusiveStartKey;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: TERMINAL_CAPACITY_TABLE,
        ExclusiveStartKey,
      })
    );
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items
    .map((item) => {
      const unwrapped = unwrapDynamoValue(item);
      const startDate = parseDateInput(unwrapped.startDate);
      const updatedAt = parseDateInput(unwrapped.updatedAt || unwrapped.createdAt);
      const repeatConfigRaw = unwrapDynamoValue(unwrapped.repeatConfig);
      const repeatConfig =
        repeatConfigRaw && typeof repeatConfigRaw === "object" ? repeatConfigRaw : {};

      if (!startDate || !updatedAt) return null;
      return {
        capacity: Number(unwrapped.capacity || 0),
        capacityType: (unwrapped.capacityType || "").toString(),
        isActive: Boolean(unwrapped.isActive ?? true),
        startDate,
        endDate: parseDateInput(unwrapped.endDate),
        repeat: (unwrapped.repeat || "Never").toString(),
        repeatConfig,
        updatedAt,
      };
    })
    .filter(Boolean);
}

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
        it.cargoUnitID ||
        it.containerID ||   // keep fallback for safety if any old-shaped items exist
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
    it.cargoUnitID ||
    it.containerID ||   // keep fallback for safety if any old-shaped items exist
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
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

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
      const dt = parseDateInput(candidateTime);
      if (!Number.isNaN(dt.getTime())) {
        const diffHrs = (dt - now) / (1000 * 60 * 60);
        const isToday = dt >= todayStart && dt < tomorrowStart;
        if ((diffHrs >= 0 && diffHrs <= 72) || isToday) {
          upcomingAppointments.push({
            cargoUnitID: it.cargoUnitID || it.containerID || it.containerId || null,
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

function buildTerminalEnrichment({ agg, terminalCapacityRecords }) {
  const now = new Date();
  const today = startOfDay(now);
  const recordsByPriority = [...terminalCapacityRecords].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  const capacityTrend = Array.from({ length: 14 }, (_, offset) => {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);

    const activeForDay = recordsByPriority.filter((record) => appliesOnDate(record, day));
    const chosen =
      activeForDay.find((record) => record.capacityType.toUpperCase() === "TEMPORARY") ||
      activeForDay.find((record) => record.capacityType.toUpperCase() === "MAXIMUM") ||
      activeForDay[0];

    return {
      date: day.toISOString().slice(0, 10),
      capacity: chosen?.capacity || 0,
    };
  });

  const eventsByDate = {};
  for (const ev of agg.upcomingEvents || []) {
    const key = ev.when.slice(0, 10);
    eventsByDate[key] = (eventsByDate[key] || 0) + 1;
  }

  const todayKey = today.toISOString().slice(0, 10);
  const arrivingToday = eventsByDate[todayKey] || 0;
  const capacityToday = capacityTrend[0]?.capacity || 0;
  const utilizationPct = capacityToday > 0 ? Math.round((arrivingToday / capacityToday) * 100) : 0;

  const projection3Days = capacityTrend.slice(0, 3).map((entry) => {
    const arriving = eventsByDate[entry.date] || 0;
    const utilization = entry.capacity > 0 ? Math.round((arriving / entry.capacity) * 100) : 0;
    return {
      date: entry.date,
      capacity: entry.capacity,
      arriving,
      utilizationPct: utilization,
    };
  });

  const congestionAlert = projection3Days.find((d) => d.utilizationPct >= 90) || null;

  const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    level: "low",
  }));
  for (const ev of agg.upcomingEvents || []) {
    if (!ev.when.startsWith(todayKey)) continue;
    const hour = new Date(ev.when).getHours();
    activityByHour[hour].count += 1;
  }
  for (const item of activityByHour) {
    if (item.count >= 25) item.level = "high";
    else if (item.count >= 10) item.level = "medium";
  }

  return {
    capacityToday,
    arrivingToday,
    utilizationPct,
    capacityTrend,
    projection3Days,
    congestionAlert,
    activityByHour,
    thresholds: {
      warningPct: 70,
      congestionPct: 90,
    },
  };
}

function shapeByRole(roleNorm, agg, extras = {}) {
  // NOTE:
  // Your old code compared against Title Case role strings (e.g., "Terminal Operator"),
  // but your getRoleNormalized() returns lowercase + normalized spaces.
  //
  // So we shape based on keywords.

  if (roleNorm.includes("terminal")) {
    const terminal = extras.terminal || {};
    return {
      statusDistribution: agg.statusDistribution,
      approvalQueueSummary: agg.reservationStatusDistribution,
      eventsToday: agg.upcomingEvents.slice(0, 50),
      // New terminal-specific fields for richer dashboard behavior
      terminalCapacity: {
        capacityToday: terminal.capacityToday || 0,
        arrivingToday: terminal.arrivingToday || 0,
        utilizationPct: terminal.utilizationPct || 0,
      },
      capacityTrend: terminal.capacityTrend || [],
      capacityProjection: terminal.projection3Days || [],
      congestionAlert: terminal.congestionAlert,
      activityByHour: terminal.activityByHour || [],
      thresholds: terminal.thresholds || { warningPct: 70, congestionPct: 90 },
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
    let extras = {};
    if (roleNorm.includes("terminal")) {
      const terminalCapacityRecords = await fetchTerminalCapacityRecords();
      extras = {
        terminal: buildTerminalEnrichment({
          agg,
          terminalCapacityRecords,
        }),
      };
    }

    const data = shapeByRole(roleNorm, agg, extras);

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
