import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const BERTH_REQUESTS_TABLE = process.env.BERTH_REQUESTS_TABLE || "BerthRequests";
const BERTH_MANIFEST_TABLE = process.env.BERTH_MANIFEST_TABLE || "BerthManifestItems";
const BERTH_CONFIG_TABLE = process.env.BERTH_CONFIG_TABLE || "BerthConfig";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const ALLOWED_SERVICES = new Set([
  "Food",
  "Water",
  "Crew Services",
  "Waste Disposal",
  "Fuel",
]);

function getRouteKey(event) {
  if (event.routeKey) return event.routeKey;
  if (event.requestContext?.resourcePath && event.httpMethod) {
    return `${event.httpMethod} ${event.requestContext.resourcePath}`;
  }
  return "";
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
}

function normalizeServices(services) {
  if (!Array.isArray(services)) return [];
  return services
    .map((s) => (s || "").toString().trim())
    .filter((s) => ALLOWED_SERVICES.has(s));
}

function getClaims(event) {
  return (
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    null
  );
}

function getRole(event) {
  const claims = getClaims(event);
  return (claims?.["custom:role"] || "").toString().trim();
}

function getUserIdentity(event) {
  const claims = getClaims(event);
  return (
    claims?.email ||
    claims?.["cognito:username"] ||
    claims?.sub ||
    "system"
  ).toString();
}

function roleIncludes(role, text) {
  return role.toLowerCase().includes(text.toLowerCase());
}

function ensureTerminalOperator(event) {
  const role = getRole(event);
  // Keep this permissive for local/manual testing where authorizer may be omitted.
  if (!role) return true;
  return roleIncludes(role, "terminal");
}

function toIsoOrNull(value) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function decodeManifestCsv(manifestCsvContent, manifestCsvBase64) {
  const text = (manifestCsvContent || "").toString();
  if (text.trim()) return text;

  const b64 = (manifestCsvBase64 || "").toString().trim();
  if (!b64) return "";

  try {
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    for (let h = 0; h < headers.length; h += 1) {
      row[headers[h]] = cols[h] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function mapManifestRow(row, nowIso) {
  const cargoUnitID =
    row.cargounitid || row["cargo unit id"] || row.containerid || row["container id"];

  if (!cargoUnitID) {
    return null;
  }

  return {
    cargoUnitID: cargoUnitID.toString().trim(),
    vesselID: (row.vesselid || row["vessel id"] || "").toString().trim() || null,
    arrivalDate: (row.arrivaldate || row["arrival date"] || "").toString().trim() || null,
    bcoEmail: (row.bcoemail || row["bco email"] || "").toString().trim() || null,
    bcoName: (row.bconame || row["bco name"] || "").toString().trim() || null,
    origin: (row.origin || "").toString().trim() || null,
    destination: (row.destination || "").toString().trim() || null,
    containerStatus:
      (row.containerstatus || row["container status"] || "On-Ship").toString().trim() || "On-Ship",
    bookingStatus: "unassigned",
    reservationStatus: "UNRESERVED",
    flag: false,
    isTransportationNotify: false,
    isBCONotify: false,
    isTerminalNotify: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function encodeNextToken(lastKey) {
  if (!lastKey) return null;
  return Buffer.from(JSON.stringify(lastKey), "utf-8").toString("base64");
}

function decodeNextToken(token) {
  if (!token) return null;
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function validateRequestPayload(body) {
  const etaAt = toIsoOrNull(body.etaAt);
  const etdAt = toIsoOrNull(body.etdAt);

  if (!(body.vesselAgentEmail || "").toString().trim()) {
    return "vesselAgentEmail is required";
  }

  if (!etaAt || !etdAt) {
    return "etaAt and etdAt are required ISO date-time values";
  }

  if (new Date(etdAt).getTime() <= new Date(etaAt).getTime()) {
    return "etdAt must be greater than etaAt";
  }

  return null;
}

async function getBerthConfig(terminalId) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: BERTH_CONFIG_TABLE,
      Key: { terminalId },
    })
  );
  return result.Item || null;
}

function normalizeBerthConfig(body, user) {
  const nowIso = new Date().toISOString();
  const terminalId = (body.terminalId || "DEFAULT_TERMINAL").toString().trim() || "DEFAULT_TERMINAL";
  const berthCapacity = Number(body.berthCapacity || 0);
  const assignmentMode = (body.assignmentMode || "NUMERIC").toString().toUpperCase();
  const berthDesignations = Array.isArray(body.berthDesignations)
    ? body.berthDesignations
        .map((x) => (x || "").toString().trim())
        .filter(Boolean)
    : [];

  return {
    terminalId,
    berthCapacity: Number.isFinite(berthCapacity) && berthCapacity >= 0 ? berthCapacity : 0,
    assignmentMode: assignmentMode === "DESIGNATIONS" ? "DESIGNATIONS" : "NUMERIC",
    berthDesignations,
    updatedAt: nowIso,
    updatedBy: user,
  };
}

function validateBerthAssignment(assignment, config) {
  if (!assignment) return "berthAssignment is required";

  const berthId = (assignment.berthId || "").toString().trim();
  const designation = (assignment.designation || "").toString().trim();

  if (!config) {
    // If config table is not populated yet, allow non-empty assignment.
    if (!berthId && !designation) return "berthAssignment.berthId or berthAssignment.designation is required";
    return null;
  }

  if (config.assignmentMode === "DESIGNATIONS") {
    const options = new Set((config.berthDesignations || []).map((x) => x.toString()));
    const candidate = designation || berthId;
    if (!candidate) return "berthAssignment designation is required";
    if (!options.has(candidate)) {
      return `berthAssignment must be one of configured designations: ${Array.from(options).join(", ")}`;
    }
    return null;
  }

  // NUMERIC mode: berth assignment should be between 1..berthCapacity.
  const candidateRaw = berthId || designation;
  const candidate = Number(candidateRaw);
  if (!Number.isInteger(candidate) || candidate < 1) {
    return "berthAssignment must be a positive berth number";
  }

  if (Number(config.berthCapacity || 0) > 0 && candidate > Number(config.berthCapacity)) {
    return `berthAssignment cannot exceed berthCapacity (${config.berthCapacity})`;
  }

  return null;
}

async function ingestManifest(requestItem) {
  const csvText = decodeManifestCsv(requestItem.manifestCsvContent, requestItem.manifestCsvBase64);
  if (!csvText.trim()) {
    throw new Error("Manifest content missing: provide manifestCsvContent or manifestCsvBase64 in request");
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { ingestedCount: 0, skippedCount: 0 };
  }

  const nowIso = new Date().toISOString();
  let ingestedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2;
    const row = rows[i];
    const mapped = mapManifestRow(row, nowIso);

    if (!mapped) {
      skippedCount += 1;
      await dynamo.send(
        new PutCommand({
          TableName: BERTH_MANIFEST_TABLE,
          Item: {
            berthRequestId: requestItem.requestId,
            rowKey: `ROW#${rowNumber}`,
            ingestionStatus: "FAILED",
            ingestionError: "Missing cargoUnitID",
            rowNumber,
            rawRow: row,
            manifestFileName: requestItem.manifestFileName,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        })
      );
      continue;
    }

    await dynamo.send(
      new PutCommand({
        TableName: BERTH_MANIFEST_TABLE,
        Item: {
          berthRequestId: requestItem.requestId,
          rowKey: `ROW#${rowNumber}`,
          rowNumber,
          ingestionStatus: "COMPLETED",
          ingestionError: null,
          manifestFileName: requestItem.manifestFileName,
          manifestPath: requestItem.manifestPath,
          cargoUnitID: mapped.cargoUnitID,
          parsedData: mapped,
          sourceData: row,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      })
    );

    ingestedCount += 1;
  }

  return { ingestedCount, skippedCount };
}

async function createBerthConfig(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can update berth configuration" });
  }

  const body = parseBody(event);
  const user = getUserIdentity(event);
  const cfg = normalizeBerthConfig(body, user);

  await dynamo.send(
    new PutCommand({
      TableName: BERTH_CONFIG_TABLE,
      Item: cfg,
    })
  );

  return response(200, cfg);
}

async function readBerthConfig(event) {
  const terminalId = (event.queryStringParameters?.terminalId || "DEFAULT_TERMINAL").toString();
  const cfg = await getBerthConfig(terminalId);
  if (!cfg) return response(404, { message: "Berth config not found", terminalId });
  return response(200, cfg);
}

async function createRequest(event) {
  const body = parseBody(event);
  const validation = validateRequestPayload(body);
  if (validation) {
    return response(400, { message: validation });
  }

  const terminalId = (body.terminalId || "DEFAULT_TERMINAL").toString();
  const config = await getBerthConfig(terminalId);
  const assignmentError = validateBerthAssignment(body.berthAssignment, config);
  if (assignmentError) {
    return response(400, { message: assignmentError });
  }

  const nowIso = new Date().toISOString();
  const requestId = randomUUID();
  const services = normalizeServices(body.services);

  const requestItem = {
    requestId,
    terminalId,
    vesselAgentEmail: (body.vesselAgentEmail || "").toString().trim(),
    vesselID: (body.vesselID || "").toString().trim() || null,
    berthAssignment: body.berthAssignment || null,
    etaAt: toIsoOrNull(body.etaAt),
    etdAt: toIsoOrNull(body.etdAt),
    ataAt: null,
    atdAt: null,
    requestedAt: nowIso,
    services,
    manifestFileName: (body.manifestFileName || "").toString().trim() || null,
    manifestPath: (body.manifestPath || "").toString().trim() || null,
    manifestCsvContent: (body.manifestCsvContent || "").toString() || null,
    manifestCsvBase64: (body.manifestCsvBase64 || "").toString() || null,
    status: "PENDING",
    denialComment: null,
    decisionAt: null,
    decidedBy: null,
    ingestionStatus: "NOT_STARTED",
    ingestedAt: null,
    ingestionError: null,
    ingestedCount: 0,
    skippedCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await dynamo.send(new PutCommand({ TableName: BERTH_REQUESTS_TABLE, Item: requestItem }));
  return response(201, requestItem);
}

async function listRequests(event) {
  const terminalId = event.queryStringParameters?.terminalId;
  const vesselAgentEmail = event.queryStringParameters?.vesselAgentEmail;
  const status = event.queryStringParameters?.status;

  const requestedLimit = Number(event.queryStringParameters?.limit || 25);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(100, requestedLimit))
    : 25;

  const nextToken = event.queryStringParameters?.nextToken;
  const exclusiveStartKey = decodeNextToken(nextToken);
  if (nextToken && !exclusiveStartKey) {
    return response(400, { message: "Invalid nextToken" });
  }

  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];

  if (terminalId) {
    expressionNames["#terminalId"] = "terminalId";
    expressionValues[":terminalId"] = terminalId;
    clauses.push("#terminalId = :terminalId");
  }

  if (vesselAgentEmail) {
    expressionNames["#vesselAgentEmail"] = "vesselAgentEmail";
    expressionValues[":vesselAgentEmail"] = vesselAgentEmail;
    clauses.push("#vesselAgentEmail = :vesselAgentEmail");
  }

  if (status) {
    expressionNames["#status"] = "status";
    expressionValues[":status"] = status;
    clauses.push("#status = :status");
  }

  const scanInput = {
    TableName: BERTH_REQUESTS_TABLE,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey || undefined,
    FilterExpression: clauses.length ? clauses.join(" AND ") : undefined,
    ExpressionAttributeNames: Object.keys(expressionNames).length ? expressionNames : undefined,
    ExpressionAttributeValues: Object.keys(expressionValues).length ? expressionValues : undefined,
  };

  const result = await dynamo.send(new ScanCommand(scanInput));
  const items = (result.Items || []).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  return response(200, {
    items,
    count: items.length,
    nextToken: encodeNextToken(result.LastEvaluatedKey),
  });
}

async function getRequest(event) {
  const requestId = event.pathParameters?.requestId;
  if (!requestId) return response(400, { message: "requestId is required" });

  const result = await dynamo.send(
    new GetCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
    })
  );

  if (!result.Item) return response(404, { message: "Request not found" });
  return response(200, result.Item);
}

async function updateRequest(event) {
  const requestId = event.pathParameters?.requestId;
  const body = parseBody(event);
  if (!requestId) return response(400, { message: "requestId is required" });

  const existing = await dynamo.send(
    new GetCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
    })
  );

  if (!existing.Item) return response(404, { message: "Request not found" });

  const mergedForValidation = {
    ...existing.Item,
    ...body,
    etaAt: body.etaAt ?? existing.Item.etaAt,
    etdAt: body.etdAt ?? existing.Item.etdAt,
    vesselAgentEmail: body.vesselAgentEmail ?? existing.Item.vesselAgentEmail,
  };

  const validation = validateRequestPayload(mergedForValidation);
  if (validation) {
    return response(400, { message: validation });
  }

  const terminalId = (existing.Item.terminalId || body.terminalId || "DEFAULT_TERMINAL").toString();
  const config = await getBerthConfig(terminalId);
  const assignment = body.berthAssignment ?? existing.Item.berthAssignment;
  const assignmentError = validateBerthAssignment(assignment, config);
  if (assignmentError) {
    return response(400, { message: assignmentError });
  }

  const nowIso = new Date().toISOString();
  const updates = {
    etaAt: toIsoOrNull(body.etaAt ?? existing.Item.etaAt),
    etdAt: toIsoOrNull(body.etdAt ?? existing.Item.etdAt),
    berthAssignment: assignment,
    services: body.services ? normalizeServices(body.services) : existing.Item.services,
    manifestFileName: body.manifestFileName ?? existing.Item.manifestFileName,
    manifestPath: body.manifestPath ?? existing.Item.manifestPath,
    manifestCsvContent: body.manifestCsvContent ?? existing.Item.manifestCsvContent,
    manifestCsvBase64: body.manifestCsvBase64 ?? existing.Item.manifestCsvBase64,
    updatedAt: nowIso,
  };

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression:
        "SET etaAt = :etaAt, etdAt = :etdAt, berthAssignment = :berthAssignment, services = :services, manifestFileName = :manifestFileName, manifestPath = :manifestPath, manifestCsvContent = :manifestCsvContent, manifestCsvBase64 = :manifestCsvBase64, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":etaAt": updates.etaAt,
        ":etdAt": updates.etdAt,
        ":berthAssignment": updates.berthAssignment,
        ":services": updates.services,
        ":manifestFileName": updates.manifestFileName,
        ":manifestPath": updates.manifestPath,
        ":manifestCsvContent": updates.manifestCsvContent,
        ":manifestCsvBase64": updates.manifestCsvBase64,
        ":updatedAt": updates.updatedAt,
      },
    })
  );

  return getRequest(event);
}

async function decideRequest(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can approve/deny berth requests" });
  }

  const requestId = event.pathParameters?.requestId;
  const body = parseBody(event);
  const decision = (body.decision || "").toString().toUpperCase();

  if (!requestId) return response(400, { message: "requestId is required" });
  if (decision !== "APPROVED" && decision !== "DENIED") {
    return response(400, { message: "decision must be APPROVED or DENIED" });
  }

  const existingResult = await dynamo.send(
    new GetCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
    })
  );
  const existing = existingResult.Item;
  if (!existing) return response(404, { message: "Request not found" });

  // Idempotent approve: if already approved and ingestion completed, return current item.
  if (decision === "APPROVED" && existing.status === "APPROVED" && existing.ingestionStatus === "COMPLETED") {
    return response(200, existing);
  }

  const nowIso = new Date().toISOString();
  const user = getUserIdentity(event);
  const denialComment = decision === "DENIED" ? (body.denialComment || "").toString() : null;

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression:
        "SET #status = :status, denialComment = :denialComment, decisionAt = :decisionAt, decidedBy = :decidedBy, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": decision,
        ":denialComment": denialComment,
        ":decisionAt": nowIso,
        ":decidedBy": user,
        ":updatedAt": nowIso,
      },
    })
  );

  if (decision === "DENIED") return getRequest(event);

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: BERTH_REQUESTS_TABLE,
        Key: { requestId },
        UpdateExpression: "SET ingestionStatus = :ingestionStatus, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":ingestionStatus": "IN_PROGRESS",
          ":updatedAt": nowIso,
        },
      })
    );

    const ingestion = await ingestManifest(existing);

    await dynamo.send(
      new UpdateCommand({
        TableName: BERTH_REQUESTS_TABLE,
        Key: { requestId },
        UpdateExpression:
          "SET ingestionStatus = :ingestionStatus, ingestedAt = :ingestedAt, ingestionError = :ingestionError, ingestedCount = :ingestedCount, skippedCount = :skippedCount, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":ingestionStatus": "COMPLETED",
          ":ingestedAt": new Date().toISOString(),
          ":ingestionError": null,
          ":ingestedCount": ingestion.ingestedCount,
          ":skippedCount": ingestion.skippedCount,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    await dynamo.send(
      new UpdateCommand({
        TableName: BERTH_REQUESTS_TABLE,
        Key: { requestId },
        UpdateExpression:
          "SET ingestionStatus = :ingestionStatus, ingestionError = :ingestionError, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":ingestionStatus": "FAILED",
          ":ingestionError": err?.message || "Manifest ingestion failed",
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    return response(500, {
      message: "Request approved but manifest ingestion failed",
      error: err?.message || "Unknown ingestion error",
    });
  }

  return getRequest(event);
}

async function recordArrival(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can record ATA" });
  }

  const requestId = event.pathParameters?.requestId;
  if (!requestId) return response(400, { message: "requestId is required" });

  const body = parseBody(event);
  const ataAt = toIsoOrNull(body.ataAt) || new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression: "SET ataAt = :ataAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":ataAt": ataAt,
        ":updatedAt": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(requestId)",
    })
  );

  return getRequest(event);
}

async function recordDeparture(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can record ATD" });
  }

  const requestId = event.pathParameters?.requestId;
  if (!requestId) return response(400, { message: "requestId is required" });

  const body = parseBody(event);
  const atdAt = toIsoOrNull(body.atdAt) || new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression: "SET atdAt = :atdAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":atdAt": atdAt,
        ":updatedAt": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(requestId)",
    })
  );

  return getRequest(event);
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    const routeKey = getRouteKey(event);

    switch (routeKey) {
      case "GET /berthConfig":
        return await readBerthConfig(event);
      case "PUT /berthConfig":
        return await createBerthConfig(event);
      case "POST /berthRequests":
        return await createRequest(event);
      case "GET /berthRequests":
        return await listRequests(event);
      case "GET /berthRequests/{requestId}":
        return await getRequest(event);
      case "PUT /berthRequests/{requestId}":
        return await updateRequest(event);
      case "POST /berthRequests/{requestId}/decision":
        return await decideRequest(event);
      case "POST /berthRequests/{requestId}/arrival":
        return await recordArrival(event);
      case "POST /berthRequests/{requestId}/departure":
        return await recordDeparture(event);
      default:
        return response(404, { message: `Unsupported route: ${routeKey}` });
    }
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: "Request not found" });
    }

    console.error("berth-registration-manager error:", err);
    return response(500, { message: err?.message || "Internal server error" });
  }
};
