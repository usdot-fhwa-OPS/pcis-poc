import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { AdminGetUserCommand, CognitoIdentityProviderClient,AdminUpdateUserAttributesCommand  } from "@aws-sdk/client-cognito-identity-provider";



const BERTH_REQUESTS_TABLE = process.env.BERTH_REQUESTS_TABLE || "BerthRequests";
const BERTH_MANIFEST_TABLE = process.env.BERTH_MANIFEST_TABLE || "BerthManifestItems";
const BERTH_CONFIG_TABLE = process.env.BERTH_CONFIG_TABLE || "BerthConfig";

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_ODcx7VXFP';


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
    reservationStatus: "unassigned",
    flag: false,
    isTransportationNotify: false,
    isBCONotify: false,
    isTerminalNotify: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    isHazardous: (row.ishazardous),
    isCompliant:(row.iscompliant),
    documentsChecked:(row.documentschecked)
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

async function validateRequestPayload(body) {
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

  await  validateManifest(body)

    return null;
 
}

async function getBerthConfigList(event, userAttributes) {

  const keyTerminalIds = [];
  const terminalIdList = userAttributes.attributes['custom:terminalId'];
  if (terminalIdList) {

    terminalIdList.split(',').forEach((terminalId) => {
      keyTerminalIds.push({ terminalId: terminalId });

    })
  }

  const params = {
    RequestItems: {
      [BERTH_CONFIG_TABLE]: {
        Keys: keyTerminalIds,

      }
    }
  };

  try {
    const data = await dynamo.send(new BatchGetCommand(params));
    console.log("Success:", data.Responses[BERTH_CONFIG_TABLE]);

    // Note: Always check for UnprocessedKeys in production if hitting limits
    if (Object.keys(data.UnprocessedKeys).length > 0) {
      console.log("Unprocessed keys remain:", data.UnprocessedKeys);
    }
    return response(200, data.Responses[BERTH_CONFIG_TABLE] || null);
  } catch (err) {
    console.error("Error fetching batch:", err);
  }
  
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

async function getAllBerthConfig() {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: BERTH_CONFIG_TABLE,
    })
  );
  return result.Items || null;
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

async function validateManifest(requestItem) {
  //const csvText = decodeManifestCsv(requestItem.manifestCsvContent, requestItem.manifestCsvBase64);
  const csvText = await readFile(requestItem.manifestPath);
  if (!csvText.trim()) {
    throw new Error("Manifest content missing: provide manifestCsvContent or manifestCsvBase64 in request");
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
     throw new Error("Manifest content missing: cargo information");
  }
  const nowIso = new Date().toISOString(); 
  const vesselId = rows[0].vesselid

  let hazmatCount = 0;
  const errorList = new Set();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const mapped = mapManifestRow(row, nowIso);

    if (!mapped) {
      skippedCount += 1;
      continue;
    }
    if(mapped.isHazardous?.trim() === 'TRUE'){
        if((mapped.isCompliant?.trim() === 'FALSE') && (mapped.documentsChecked === 'TRUE')){
          const err = `Ensure Manifest content for CargoUnit ID ${mapped.cargoUnitID} and Vessel ID ${mapped.vesselID} has documentsChecked and isCompliant are both TRUE or both FALSE `
          console.log(err);
          errorList.add(err);

        }
      hazmatCount++;
    } 
    if (row.vesselid !== vesselId) {
      const err = `Ensure the Vessel ID in the Manifest content for Cargo Unit  ${mapped.cargoUnitID} matches the Vessel ID of the first entry `;
      console.log(err);
      errorList.add(err);
    }
  }
  if(errorList.size > 0){
    let errors = [];
    for(const error of  errorList){
      errors.push(error)}
    throw new Error(`Validation of Manifest file ${requestItem.manifestPath} failed with errors, ${errors}`)
  }
  requestItem.hazmatCount = hazmatCount
  requestItem.vesselID = vesselId;
  return null;
}

async function ingestManifest(requestItem) {
  //const csvText = decodeManifestCsv(requestItem.manifestCsvContent, requestItem.manifestCsvBase64);
  const csvText = await readFile(requestItem.manifestPath);
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
      continue;
    }
    if (row.ishazardous === 'TRUE') {
      await dynamo.send(
        new PutCommand({
          TableName: "HazardousCargo",
          Item: {
            "vesselId": row.vesselid,
            "cargoUnitID": row.cargounitid,
            "arrivalDate": row.arrivaldate,
            "bcoEmail": row.bcoemail,
            "bcoName": row.bconame,
            "cargoType": row.cargotype,
            "cargoUnitStatus": row.cargounitstatus,
            "destination": row.destination,
            "flaggedDateTime": row.flaggeddatetime,
            "isCompliant": (row.iscompliant.toLowerCase() === 'true')?true:false,
            "isHazardous": true,
            "origin": row.origin,
            "priority": row.priority,
            "reviewStatus": row.reviewstatus,
            "vesselAgentEmail": requestItem.vesselAgentEmail,
            "vesselAgentName": requestItem.vesselAgentName,
            "weight": row.weight,
            "documentsChecked": (row.documentschecked.toLowerCase() === 'true')?true:false,
            "hazmatClass": row.hazmatclass,
            "unNumber": row.unnumber
          }
        })
      );

    } else {
      await dynamo.send(
        new PutCommand({
          TableName: "CargoUnits",
          Item: {
            "cargoUnitID": row.cargounitid,
            "arrivalDate": row.arrivaldate,
            "bcoEmail": row.bcoemail,
            "bcoName": row.bconame,
            "bookingStatus":  row.cargounitstatus,
            "containerStatus": row.containerstatus,
            "createdAt": nowIso,
            "destination": row.destination,
            "flag": "FALSE",
            "isBCONotify": "FALSE",
            "isHazardous": "FALSE",
            "isTerminalNotify": "FALSE",
            "isTransportationNotify": "FALSE",
            "origin": row.origin,
            "reservationStatus": 'unassigned',
            "updatedAt": nowIso,
            "vesselID": row.vesselid,
          },
        })
      );

    }

    ingestedCount += 1;
  }

  return { ingestedCount, skippedCount };
}

async function addTerminalIdInUsersProfile(username, userAttributes, terminalId){
  const existingTerminalId = userAttributes.attributes["custom:terminalId"]
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: []
  };
  if (terminalId) {
    params.UserAttributes.push({
      Name: "custom:terminalId",
      Value: (existingTerminalId)?existingTerminalId+','+terminalId:terminalId
    })
  }

  try {
    const command = new AdminUpdateUserAttributesCommand(params);
    const response = await cognitoClient.send(command);

    return response
  } catch (error) {
    console.error("Error updating user attributes:", error);
    return error
  }

};

async function saveBerthConfig(event, userAttributes) {
  const body = parseBody(event);
  const terminalIdList = userAttributes.attributes['custom:terminalId'];
  if (terminalIdList.includes(body.terminalId)) {
    const nowIso = new Date().toISOString();
    const result = await dynamo.send(
      new PutCommand({
        TableName: BERTH_CONFIG_TABLE,
        Item: {
          "terminalId": body.terminalId,
          "terminalName": body.terminalName,
          "terminalEmail": body.terminalEmail,
          "terminalPhone": body.terminalPhone,
          "assignmentMode": body.assignmentMode,
          "berthCapacity": body.berthCapacity,
          "berthDesignations": body.berthDesignations,
          "address": body.address,
          "timezone": body.timezone,
          "terminalType": body.terminalType,
          "overtimeRatePerHour": body.overtimeRatePerHour,
          "lateGracePeriodMins": body.lateGracePeriodMins,
          "weeklyHours": body.weeklyHours,
          "createdAt": nowIso,
          "createdBy": userAttributes.attributes.email,
        },
      })
    );

    const userId = event.queryStringParameters?.userId;
    if (userId) {
      const userAttributes = await getUserAttributes(userId);
      await addTerminalIdInUsersProfile(userId, userAttributes, body.terminalId)
    }

    return response(200, result);
  } else {
    return response(403, 'Access denied to Terminal.');
  }
}

async function readBerthConfig(event) {
  const terminalId = (event.queryStringParameters?.terminalId || "DEFAULT_TERMINAL").toString();
  const cfg = await getBerthConfig(terminalId);
  if (!cfg) return response(404, { message: "Berth config not found", terminalId });
  return response(200, cfg);
}

async function listBerthConfig(event) {
  const list = await getAllBerthConfig();
  if (!list) return response(404, { message: "Unable to list Berth configs" });
  return response(200, list);
}

async function createRequest(event) {
  const body = parseBody(event);
  const validation = await validateRequestPayload(body);
  if (validation) {
    return response(400, { message: validation });
  }

  const terminalId = (body.terminalId || "DEFAULT_TERMINAL").toString();
  const config = await getBerthConfig(terminalId);
  /*
  const assignmentError = validateBerthAssignment(body.berthAssignment, config);
  if (assignmentError) {
    return response(400, { message: assignmentError });
  }
*/
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
    hazmatCount: body.hazmatCount,
    status: "REQUESTED",
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

function addTerminalIdToClause(expressionNames, expressionValues, clauses, userAttributes) {
  const terminalIdList = userAttributes.attributes['custom:terminalId'];
  if (terminalIdList) {
    const orClause = [];
    terminalIdList.split(',').forEach((terminalId, i) => {
      expressionNames["#terminalId"] = "terminalId";
      expressionValues[":terminalId"+i] = terminalId;
      orClause.push("#terminalId = :terminalId"+i);

    })
    clauses.push('('+orClause.join(' OR ')+')')
  }
}

async function listRequests(event, userAttributes) {
  
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

  
  addTerminalIdToClause(expressionNames, expressionValues, clauses, userAttributes)
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
  console.log(event)
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

  const validation = await validateRequestPayload(mergedForValidation);
  if (validation) {
    return response(400, { message: validation });
  }

  const terminalId = (existing.Item.terminalId || body.terminalId || "DEFAULT_TERMINAL").toString();
  const config = await getBerthConfig(terminalId);
  const assignment = body.berthAssignment ?? existing.Item.berthAssignment;
  // const assignmentError = validateBerthAssignment(assignment, config);
  // if (assignmentError) {
  //   return response(400, { message: assignmentError });
  // }

  const nowIso = new Date().toISOString();
  const updates = {
    etaAt: toIsoOrNull(body.etaAt ?? existing.Item.etaAt),
    etdAt: toIsoOrNull(body.etdAt ?? existing.Item.etdAt),
    ataAt: toIsoOrNull(body.ataAt ?? existing.Item.ataAt),
    atdAt: toIsoOrNull(body.atdAt ?? existing.Item.atdAt),

    berthAssignment: assignment,
    services: body.services ? normalizeServices(body.services) : existing.Item.services,
    manifestFileName: body.manifestFileName ?? existing.Item.manifestFileName,
    manifestPath: body.manifestPath ?? existing.Item.manifestPath,
    manifestCsvContent: body.manifestCsvContent ?? existing.Item.manifestCsvContent,
    manifestCsvBase64: body.manifestCsvBase64 ?? existing.Item.manifestCsvBase64,
    updatedAt: nowIso,
    status:(existing.Item.status === 'REQUESTED')?'MODIFIED':existing.Item.status,
    terminalId:terminalId,
  };

  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression:
        "SET #s = :newStatus, etaAt = :etaAt, etdAt = :etdAt, ataAt = :ataAt, atdAt = :atdAt, berthAssignment = :berthAssignment,  \
        services = :services, manifestFileName = :manifestFileName, manifestPath = :manifestPath, manifestCsvContent = :manifestCsvContent, manifestCsvBase64 = :manifestCsvBase64, updatedAt = :updatedAt, \
        terminalId = :terminalId ",

      ExpressionAttributeNames: {
          "#s": "status" // Map the placeholder to the actual keyword
      },
      ExpressionAttributeValues: {
        ":newStatus": updates.status,
        ":etaAt": updates.etaAt,
        ":etdAt": updates.etdAt,
        ":ataAt": updates.ataAt,
        ":atdAt": updates.atdAt,
        ":berthAssignment": updates.berthAssignment,
        ":services": updates.services,
        ":manifestFileName": updates.manifestFileName,
        ":manifestPath": updates.manifestPath,
        ":manifestCsvContent": updates.manifestCsvContent,
        ":manifestCsvBase64": updates.manifestCsvBase64,
        ":updatedAt": updates.updatedAt,
        ":terminalId": updates.terminalId,
      },
    })
  );

  return getRequest(event);
}

async function decideRequest(event, userAttributes) {
  const body = parseBody(event);
  
  const requestId = event.pathParameters?.requestId;
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
 // if (decision === "APPROVED" && existing.status === "APPROVED" && existing.ingestionStatus === "COMPLETED") {
 if (decision === "APPROVED" && existing.status === "APPROVED") {

    return response(200, existing);
  }

  const terminalIdList = userAttributes.attributes['custom:terminalId'];
  if (!terminalIdList.includes(existing.terminalId)) {
    return response(403, { message: "Only assigned Terminal Operator can approve/deny berth requests" });
  }

  const nowIso = new Date().toISOString();
  const user = getUserIdentity(event);
  const denialComment = decision === "DENIED" ? (body.denialComment || "").toString() : null;
  const berthAssignmentDesignation = body.berthAssignment || "";
  await dynamo.send(
    new UpdateCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression:
        "SET #status = :status, berthAssignment.designation = :berthAssignmentDesignation, denialComment = :denialComment, decisionAt = :decisionAt, decidedBy = :decidedBy, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": decision,
        ":denialComment": denialComment,
        ":decisionAt": nowIso,
        ":decidedBy": user,
        ":updatedAt": nowIso,
        ":berthAssignmentDesignation":berthAssignmentDesignation,      },
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

async function recordDelete(event) {
  const requestId = event.pathParameters?.requestId;
  if (!requestId) return response(400, { message: "requestId is required" });
  const deleteResp = await dynamo.send(
    new DeleteCommand({
      TableName: BERTH_REQUESTS_TABLE,
      Key: {
        requestId: requestId,
      },
    })
    
  );
  return response(200, `Deleted berth requrest ${requestId}`);
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

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
}

async function getUserAttributes(username) {
  const params = {
    UserPoolId: USER_POOL_ID, 
    Username: username, 
  };

  try {
    const command = new AdminGetUserCommand(params);
    const response = await cognitoClient.send(command);

    const attributes = response.UserAttributes.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {});

    return {
      username: response.Username,
      status: response.UserStatus,
      enabled: response.Enabled,
      attributes, // Contains standard attributes (e.g., email) and custom attributes (e.g., custom:role)
    };
  } catch (error) {
    console.error("Error retrieving user attributes:", error);
    throw error;
  }
}

export const handler = async (event) => {
  console.log(event)

  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader) {
    return { statusCode: 401, body: 'No authorization header' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = decodeJwtPayload(token);
  const userId = decoded.sub;
  const cognitoGroups = decoded['cognito:groups']

  const userAttributes = await getUserAttributes(userId);

  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    const routeKey = getRouteKey(event);

    switch (routeKey) {
      case "GET /berthConfig":
        return await readBerthConfig(event);
      case "GET /berthConfig/list":
        if (cognitoGroups.includes('pcis_Terminal_Operator')) {
          return await getBerthConfigList(event, userAttributes);
        } else {
          return await listBerthConfig(event);
        }
          
      case "PUT /berthConfig":
        return await saveBerthConfig(event, userAttributes);
      case "POST /berthRequests":
        return await createRequest(event);
      case "GET /berthRequests":
        return await listRequests(event, userAttributes);
      case "GET /berthRequests/{requestId}":
        return await getRequest(event);
      case "PUT /berthRequests/{requestId}":
        return await updateRequest(event);
      case "POST /berthRequests/{requestId}/decision":
        return await decideRequest(event, userAttributes);
      case "POST /berthRequests/{requestId}/arrival":
        return await recordArrival(event);
      case "POST /berthRequests/{requestId}/departure":
        return await recordDeparture(event);
      case "DELETE /berthRequest/{requestId}":
        return await recordDelete(event);

        
  
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

const s3Client = new S3Client({});


const readFile = async (filePath) => {
  const command = new GetObjectCommand({
    Bucket: "amplify-d19yhr3c3if28a-de-pcisstoragebucketd380729-t6idvpun4aup",
    Key: filePath,
  });

  const { Body } = await s3Client.send(command);
  const content = await Body.transformToString();
  return content;
};
