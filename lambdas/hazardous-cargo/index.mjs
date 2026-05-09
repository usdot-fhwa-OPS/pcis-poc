import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const HAZARDOUS_CARGO_TABLE = process.env.HAZARDOUS_CARGO_TABLE || "HazardousCargo";

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





async function listHazardousCargo(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const vesselAgentEmail = getUserIdentity(event);
  const reviewStatus = event.queryStringParameters?.reviewStatus;

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

  if (vesselId) {
    expressionNames["#vesselId"] = "vesselId";
    expressionValues[":vesselId"] = vesselId;
    clauses.push("#vesselId = :vesselId");
  }

  if (vesselAgentEmail) {
    expressionNames["#vesselAgentEmail"] = "vesselAgentEmail";
    expressionValues[":vesselAgentEmail"] = vesselAgentEmail;
    clauses.push("#vesselAgentEmail = :vesselAgentEmail");
  }

  if (reviewStatus) {
    expressionNames["#reviewStatus"] = "reviewStatus";
    expressionValues[":reviewStatus"] = reviewStatus;
    clauses.push("#reviewStatus = :reviewStatus");
  }

  const scanInput = {
    TableName: HAZARDOUS_CARGO_TABLE,
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

async function getHazardousCargo(event) {
  const vesselId = event.pathParameters?.vesselId;
  if (!vesselId) return response(400, { message: "vesselId is required" });

  const result = await dynamo.send(
    new GetCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Key: { vesselId },
    })
  );

  if (!result.Item) return response(404, { message: "HazardousCargo not found" });
  return response(200, result.Item);
}

async function updateHazardousCargo(event) {
  const vesselId = event.pathParameters?.vesselId;
  const body = parseBody(event);
  if (!vesselId) return response(400, { message: "vesselId is required" });

  const existing = await dynamo.send(
    new GetCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { vesselId },
    })
  );

  if (!existing.Item) return response(404, { message: "HazardousCargo not found" });

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
      Key: { vesselId },
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

  return getHazardousCargo(event);
}

async function decideHazardousCargo(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can approve/deny berth requests" });
  }

  const vesselId = event.pathParameters?.vesselId;
  const body = parseBody(event);
  const decision = (body.decision || "").toString().toUpperCase();

  if (!vesselId) return response(400, { message: "vesselId is required" });
  if (decision !== "APPROVED" && decision !== "DENIED") {
    return response(400, { message: "decision must be APPROVED or DENIED" });
  }

  const existingResult = await dynamo.send(
    new GetCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { vesselId },
    })
  );
  const existing = existingResult.Item;
  if (!existing) return response(404, { message: "HazardousCargo not found" });

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
      Key: { vesselId },
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

  if (decision === "DENIED") return getHazardousCargo(event);

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: BERTH_REQUESTS_TABLE,
        Key: { vesselId },
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
        Key: { vesselId },
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
        Key: { vesselId },
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
      message: "HazardousCargo approved but manifest ingestion failed",
      error: err?.message || "Unknown ingestion error",
    });
  }

  return getHazardousCargo(event);
}

async function recordArrival(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can record ATA" });
  }

  const vesselId = event.pathParameters?.vesselId;
  if (!vesselId) return response(400, { message: "vesselId is required" });

  const body = parseBody(event);
  const ataAt = toIsoOrNull(body.ataAt) || new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { vesselId },
      UpdateExpression: "SET ataAt = :ataAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":ataAt": ataAt,
        ":updatedAt": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(vesselId)",
    })
  );

  return getHazardousCargo(event);
}

async function recordDeparture(event) {
  if (!ensureTerminalOperator(event)) {
    return response(403, { message: "Only Terminal Operator can record ATD" });
  }

  const vesselId = event.pathParameters?.vesselId;
  if (!vesselId) return response(400, { message: "vesselId is required" });

  const body = parseBody(event);
  const atdAt = toIsoOrNull(body.atdAt) || new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { vesselId },
      UpdateExpression: "SET atdAt = :atdAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":atdAt": atdAt,
        ":updatedAt": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(vesselId)",
    })
  );

  return getHazardousCargo(event);
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    const routeKey = getRouteKey(event);

    switch (routeKey) {
      case "GET /hazardousCargos":
        return await listHazardousCargo(event);
      case "GET /hazardousCargos/{vesselId}":
        return await getHazardousCargo(event);
      case "PUT /hazardousCargos/{vesselId}":
        return await updateHazardousCargo(event);
      default:
        return response(404, { message: `Unsupported route: ${routeKey}` });
    }
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: "HazardousCargo not found" });
    }

    console.error("hazardous-cargo-manager error:", err);
    return response(500, { message: err?.message || "Internal server error" });
  }
};
