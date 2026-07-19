import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  TransactWriteCommand,
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




async function listHazardousCargo(event) {
  
  const vesselId = event.queryStringParameters?.vesselId;
  const vesselAgentEmail = event.queryStringParameters?.vesselAgentEmail; 
  const bcoEmail = event.queryStringParameters?.bcoEmail; 
  
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
  
  if (bcoEmail) {
    expressionNames["#bcoEmail"] = "bcoEmail";
    expressionValues[":bcoEmail"] = bcoEmail;
    clauses.push("#bcoEmail = :bcoEmail");
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
  const cargoUnitID = event.pathParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });

  const result = await dynamo.send(
    new GetCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Key: { vesselId: vesselId, cargoUnitID: cargoUnitID},
    })
  );

  if (!result.Item) return response(404, { message: "HazardousCargo not found" });
  return response(200, result.Item);
}

async function saveHazardousCargo(event) {
  const body = event.body
  if (!body) return response(400, { message: "Hazardous Cargo  is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);
  const existingRec = await dynamo.send(
    new GetCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Key: { vesselId: record.vesselId, cargoUnitID: record.cargoUnitID },
    })
  );
  if (existingRec.Item) {
    record.updatedAt = nowIso;
    record.createdAt = existingRec.Item.createdAt;
  } else {
    record.createdAt = nowIso;

  }
  const result = await dynamo.send(
    new PutCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Item: record,
    })
  );
  return response(200, result);
}

async function requestAdditionalDocunent(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const cargoUnitID = event.queryStringParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });
  try {
    const resp = await setStatus(vesselId, cargoUnitID, "Pending Documentation");
    return response(200, { message: resp.Attributes });
  } catch (error) {
    return response(500, { message: error });
  }
}

async function flag(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const cargoUnitID = event.queryStringParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });
  try {
    const resp = await setStatus(vesselId, cargoUnitID, "Flagged");
    return response(200, { message: resp.Attributes });
  } catch (error) {
    return response(500, { message: error });
  }
}


async function completeDocumentCheck(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const cargoUnitID = event.queryStringParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });
  try {
    const nowIso = new Date().toISOString();
    const resp = await dynamo.send(
      new UpdateCommand({
        TableName: HAZARDOUS_CARGO_TABLE,
        Key: { vesselId: vesselId, cargoUnitID: cargoUnitID },
        UpdateExpression:
          "SET  documentsChecked = :documentsChecked, \
                updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":documentsChecked": true,
          ":updatedAt": nowIso,
        },
        ReturnValues: "ALL_NEW",
      }))
    return response(200, { message: resp.Attributes });
  } catch (error) {
    return response(500, { message: error });
  }
}

async function setDocumentCompliant(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const cargoUnitID = event.queryStringParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });
  try {
    const nowIso = new Date().toISOString();
    const resp = await dynamo.send(
      new UpdateCommand({
        TableName: HAZARDOUS_CARGO_TABLE,
        Key: { vesselId: vesselId, cargoUnitID: cargoUnitID },
        UpdateExpression:
          "SET  isCompliant = :isCompliant, \
                updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":isCompliant": true,
          ":updatedAt": nowIso,
        },
        ReturnValues: "ALL_NEW",
      }))
    return response(200, { message: resp.Attributes });
  } catch (error) {
    return response(500, { message: error });
  }
}

async function approve(event) {
  const vesselId = event.queryStringParameters?.vesselId;
  const cargoUnitID = event.queryStringParameters?.cargoUnitID;
  if (!vesselId || !cargoUnitID) return response(400, { message: "vesselId and cargoUnitID are required" });
  const existingHazardousCargoRecord = await dynamo.send(
    new GetCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Key: { vesselId: vesselId, cargoUnitID: cargoUnitID},
    })
  );
  if (existingHazardousCargoRecord) {
    const existingHazardousCargo = existingHazardousCargoRecord.Item;
     const nowIso = new Date().toISOString();
    const status = 'APPROVED'
    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: HAZARDOUS_CARGO_TABLE,
            Key: { vesselId: vesselId, cargoUnitID: cargoUnitID },
            UpdateExpression:
              "SET reviewStatus = :status, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":status": status,
              ":updatedAt": nowIso,
            }, ReturnValues: "ALL_NEW",
          },
        },
        {
          Put: {
            TableName: "CargoUnits",
            Item: {
              "cargoUnitID": existingHazardousCargo.cargoUnitID,
              "arrivalDate": existingHazardousCargo.arrivalDate,
              "bcoEmail": existingHazardousCargo.bcoEmail,
              "bcoName": existingHazardousCargo.bcoName,
              //"bookingStatus":  row.cargounitstatus,
              //"containerStatus": row.containerstatus,
              "createdAt": nowIso,
              "destination": existingHazardousCargo.destination,
              "flag": "FALSE",
              "isBCONotify": "FALSE",
              "isHazardous": "FALSE",
              "isTerminalNotify": "FALSE",
              "isTransportationNotify": "FALSE",
              "origin": existingHazardousCargo.origin,
              "reservationStatus": 'unassigned',
              "updatedAt": nowIso,
              "vesselID": existingHazardousCargo.vesselId,
              "documentsChecked": "TRUE",
              "isCompliant":"TRUE",
              "containerStatus": "On-Ship",
            },
          },
        }
      ]
    });

    try {
    const resp = await  dynamo.send(command);
    return response(200, { message: resp.Attributes });
  } catch (error) {
    return response(500, { message: error });
  }

  } else {
    return response(403, { message: `Not able to find Hazardous Cargo for vessel ID ${vesselId} and cargo ID ${cargoUnitID}` });
  }
  
  
}


async function setStatus(vesselId, cargoUnitID, status) {
  const nowIso = new Date().toISOString();
  return await dynamo.send(
    new UpdateCommand({
      TableName: HAZARDOUS_CARGO_TABLE,
      Key: { vesselId: vesselId, cargoUnitID: cargoUnitID },
      UpdateExpression:
        "SET reviewStatus = :status, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": nowIso,
      },
      ReturnValues: "ALL_NEW",
    })
  );

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
      case "GET /hazardousCargos/{vesselId}/{cargoUnitID}":
        return await getHazardousCargo(event);
      case "PUT /hazardousCargos/{vesselId}":
        return await saveHazardousCargo(event);
      case "PUT /requestAdditionalDocument":
        return await requestAdditionalDocunent(event);
      case "PUT /flag":
        return await flag(event);
      case "PUT /approve":
        return await approve(event);
      case "PUT /setDocumentCompliant":
        return await setDocumentCompliant(event);
      case "PUT /completeDocumentCheck":
        return await approve(event);
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
