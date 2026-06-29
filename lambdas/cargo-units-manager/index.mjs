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


const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
const LIMIT_TABLE = process.env.LIMIT_TABLE || "Limit-sfyg4lmhl5axxnl6js6gbcn7fu-NONE";

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


async function getBookingsAmount(event) {
  
  const reservationDate = event.queryStringParameters?.reservationDate; 
  
  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];

  
  
  if (reservationDate) {
    expressionNames["#reservationDate"] = "reservationDate";
    expressionValues[":reservationDate"] = reservationDate;
    clauses.push("#reservationDate = :reservationDate");
  }

  

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    FilterExpression: clauses.length ? clauses.join(" AND ") : undefined,
    ExpressionAttributeNames: Object.keys(expressionNames).length ? expressionNames : undefined,
    ExpressionAttributeValues: Object.keys(expressionValues).length ? expressionValues : undefined,
  };

  const result = await dynamo.send(new ScanCommand(scanInput));
  return response(200, {
    count: result?result.Items.length:0,
  });
}

async function fetchTransOpBookings(event) {
  
  const transopEmail = event.queryStringParameters?.transopEmail;

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

  
  
    expressionNames["#reservationStatus"] = "reservationStatus";
    expressionValues[":reservationStatus"] = 'Picked Up';
    clauses.push("#reservationStatus = :reservationStatus");
  
  if (transopEmail) {
    expressionNames["#transopEmail"] = "transopEmail";
    expressionValues[":transopEmail"] = transopEmail;
    clauses.push("#transopEmail = :transopEmail");
  }

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, reservationDate, \
                            resApprovalDate, reservationStatus, resPickupDate, reservationTime, twicEscortRequired',
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

async function fetchTermOperatorBookingsCargoUnits(event) {
  

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

  
  
    expressionNames["#reservationStatus"] = "reservationStatus";
    expressionValues[":reservationStatus"] = 'Picked Up';
    clauses.push("#reservationStatus = :reservationStatus");
  

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, reservationDate, \
                            resApprovalDate, reservationStatus, resPickupDate, reservationTime, twicEscortRequired',
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



async function fetchBcoUpcoming(event) {
  
  const bcoEmail = event.queryStringParameters?.bcoEmail;

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

  
  
    expressionNames["#reservationStatus"] = "reservationStatus";
    expressionValues[":reservationStatus"] = 'unassigned';
    clauses.push("#reservationStatus = :reservationStatus");
  
  if (bcoEmail) {
    expressionNames["#bcoEmail"] = "bcoEmail";
    expressionValues[":bcoEmail"] = bcoEmail;
    clauses.push("#bcoEmail = :bcoEmail");
  }

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, destination, bcoName, bcoEmail, \
                            transopName, transopEmail, containerStatus, arrivalDate, flag',
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

async function fetchBcoOngoing(event) {

  const selectionSet = ['vesselID', 'cargoUnitID', 'origin','destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','resApprovalDate','reservationStatus', 'resPickupDate','flag', 'updatedAt'];
  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];
  const bcoEmail = event.queryStringParameters?.bcoEmail;
  
  expressionNames["#reservationStatus1"] = "reservationStatus";
  expressionValues[":reservationStatus1"] = 'unassigned';
  clauses.push("#reservationStatus1 <> :reservationStatus1");


  expressionNames["#reservationStatus2"] = "reservationStatus";
  expressionValues[":reservationStatus2"] = 'Picked Up';
  clauses.push("#reservationStatus2 <> :reservationStatus2");

if (bcoEmail) {
  expressionNames["#bcoEmail"] = "bcoEmail";
  expressionValues[":bcoEmail"] = bcoEmail;
  clauses.push("#bcoEmail = :bcoEmail");
}

  return fetchCargoUnits(event, selectionSet.join(), expressionNames, expressionValues, (clauses.length ? clauses.join(" AND ") : undefined))
}

async function fetchBcoCompleted(event) {
  
  const bcoEmail = event.queryStringParameters?.bcoEmail;

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

  
  
    expressionNames["#reservationStatus"] = "reservationStatus";
    expressionValues[":reservationStatus"] = 'Picked Up';
    clauses.push("#reservationStatus = :reservationStatus");
  
  if (bcoEmail) {
    expressionNames["#bcoEmail"] = "bcoEmail";
    expressionValues[":bcoEmail"] = bcoEmail;
    clauses.push("#bcoEmail = :bcoEmail");
  }

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, \
                          reservationDate, resApprovalDate, reservationStatus, destination, resPickupDate, flag',
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

async function fetchTransOpUpcoming(event) {
  
  const transopEmail = event.queryStringParameters?.transopEmail;

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

  
  
    expressionNames["#reservationStatus"] = "reservationStatus";
    expressionValues[":reservationStatus"] = 'Pending Transportation Coordinator Approval';
    clauses.push("#reservationStatus = :reservationStatus");
  
  if (transopEmail) {
    expressionNames["#transopEmail"] = "transopEmail";
    expressionValues[":transopEmail"] = transopEmail;
    clauses.push("#transopEmail = :transopEmail");
  }

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, \
                            transopEmail, assignmentDate, reservationStatus, flag',
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

async function fetchTransOpOngoing(event) {
  
  const transopEmail = event.queryStringParameters?.transopEmail;

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

  
  
    expressionNames["#reservationStatus1"] = "reservationStatus";
    expressionValues[":reservationStatus1"] = 'unassigned';
    clauses.push("#reservationStatus1 <> :reservationStatus1");

    expressionNames["#reservationStatus2"] = "reservationStatus";
    expressionValues[":reservationStatus2"] = 'Pending Transportation Coordinator Approval';
    clauses.push("#reservationStatus2 <> :reservationStatus2");

    expressionNames["#reservationStatus3"] = "reservationStatus";
    expressionValues[":reservationStatus3"] = 'Picked Up';
    clauses.push("#reservationStatus3 <> :reservationStatus3");
  
  if (transopEmail) {
    expressionNames["#transopEmail"] = "transopEmail";
    expressionValues[":transopEmail"] = transopEmail;
    clauses.push("#transopEmail = :transopEmail");
  }

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, reservationDate, \
                            reservationTime, reservationStatus, twicEscortRequired, flag, containerStatus',
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


async function fetchTerminalOpRequested(event) {

  const selectionSet = 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail,reservationDate,reservationTime,reservationStatus, flag';
  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];
  expressionNames["#reservationStatus"] = "reservationStatus";
  expressionValues[":reservationStatus"] = 'Pending Reservation Approval';
  clauses.push("#reservationStatus = :reservationStatus");

  return fetchCargoUnits(event, selectionSet, expressionNames, expressionValues, (clauses.length ? clauses.join(" AND ") : undefined))

}

async function fetchTerminalOpModifiedRequested(event) {

  const selectionSet = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime', 'reservationStatus', 'modifiedReservationDate', 'modifiedReservationTime']; 

  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];
  expressionNames["#reservationStatus"] = "reservationStatus";
  expressionValues[":reservationStatus"] = 'Pickup Modification Requested';
  clauses.push("#reservationStatus = :reservationStatus");

  return fetchCargoUnits(event, selectionSet.join(), expressionNames, expressionValues, (clauses.length ? clauses.join(" AND ") : undefined))

}
async function fetchTerminalOpCompleted(event) {

  const selectionSet = [
    'vesselID',
    'cargoUnitID',
    'origin',
    'bcoName',
    'bcoEmail',
    'transopName',
    'transopEmail',
    'reservationDate',
    'resApprovalDate',
    'reservationStatus',
    'resPickupDate',
    'reservationTime',
    'twicEscortRequired'
  ] 
  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];
  expressionNames["#reservationStatus"] = "reservationStatus";
  expressionValues[":reservationStatus"] = 'Picked Up';
  clauses.push("#reservationStatus = :reservationStatus");

  return fetchCargoUnits(event, selectionSet.join(), expressionNames, expressionValues, (clauses.length ? clauses.join(" AND ") : undefined))

}


async function fetchTerminalOpOnGoing(event) {

  const selectionSet = 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, reservationDate, reservationTime, reservationStatus, twicEscortRequired, flag';
  const expressionNames = {};
  const expressionValues = {};
  const clauses = [];
  expressionNames["#reservationStatus1"] = "reservationStatus";
  expressionValues[":reservationStatus1"] = 'Pending Pick Up';
  clauses.push("#reservationStatus1 = :reservationStatus1");

  expressionNames["#reservationStatus2"] = "reservationStatus";
  expressionValues[":reservationStatus2"] = 'Late for Pick Up';
  clauses.push("#reservationStatus2 = :reservationStatus2");

  return fetchCargoUnits(event, selectionSet, expressionNames, expressionValues, (clauses.length ? clauses.join(" OR ") : undefined))

}


async function fetchCargoUnits(event, selectionSet, expressionNames, expressionValues, clauses) {
  

  const requestedLimit = Number(event.queryStringParameters?.limit || 25);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(100, requestedLimit))
    : 25;

  const nextToken = event.queryStringParameters?.nextToken;
  const exclusiveStartKey = decodeNextToken(nextToken);
  if (nextToken && !exclusiveStartKey) {
    return response(400, { message: "Invalid nextToken" });
  }


  
  

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: selectionSet,
    ExclusiveStartKey: exclusiveStartKey || undefined,
    FilterExpression: clauses,
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

async function fetchLimit(event) {


  const getInput = {
    TableName: LIMIT_TABLE,
    Key: {
      id: event.queryStringParameters?.id 
    },
    ProjectionExpression: "terminalCapacity"
  };

  const result = await dynamo.send(new GetCommand(getInput));

  return response(200,result.Item);
}

async function listCargoUnits(event) {
  
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

  
  

  const scanInput = {
    TableName: CARGO_UNITS_TABLE,
    Limit: limit,
    ProjectionExpression: 'vesselID, cargoUnitID, origin, bcoName, bcoEmail, transopName, transopEmail, containerStatus, flag',
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

async function saveCargoUnit(event) {
  const body = event.body
  if (!body) return response(400, { message: "Cargo Unit is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);

  const existingRec = await dynamo.send(
    new GetCommand({
      TableName: CARGO_UNITS_TABLE,
      Key: { cargoUnitID: record.cargoUnitID },
    })
  );
  let existingRecItem = existingRec.Item; 
  if (existingRecItem) {
    existingRecItem.updatedAt = nowIso;
    existingRecItem.createdAt = existingRec.Item.createdAt;
    Object.keys(record).forEach(key => {
      existingRecItem[key] = record[key];
    });
    record = existingRecItem;
  } else {
    record.createdAt = nowIso;

  }
  const result = await dynamo.send(
    new PutCommand({
      TableName: CARGO_UNITS_TABLE,
      Item: record,
    })
  );
  return response(200, result);
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
          Delete: {
            TableName: HAZARDOUS_CARGO_TABLE,
            Key: { vesselId: vesselId, cargoUnitID: cargoUnitID },
            ReturnValues: "ALL_NEW",
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
      case "GET /list":
        return await listCargoUnits(event);
      case "PUT /saveCargoUnit":
        return await saveCargoUnit(event);
      case "GET /getBookingsAmount":
        return await getBookingsAmount(event);
      case "GET /fetchTransOpBookings":
        return await fetchTransOpBookings(event);
      case "GET /fetchBcoUpcoming":
        return await fetchBcoUpcoming(event);
      case "GET /fetchBcoOngoing":
        return await fetchBcoOngoing(event);
      case "GET /fetchBcoCompleted":
        return await fetchBcoCompleted(event);
      case "GET /fetchTransOpUpcoming":
        return await fetchTransOpUpcoming(event);
      case "GET /fetchTransOpOngoing":
        return await fetchTransOpOngoing(event);
      case "GET /fetchTerminalOpRequested":
        return await fetchTerminalOpRequested(event);
      case "GET /fetchTerminalOpOnGoing":
        return await fetchTerminalOpOnGoing(event);
      case "GET /fetchTerminalOpModifiedRequested":
        return await fetchTerminalOpModifiedRequested(event);
      case "GET /fetchLimit":
        return await fetchLimit(event);
      case "GET /fetchTerminalOpCompleted":
        return await fetchTerminalOpCompleted(event);
      
        
      case "PUT /cargoUnits/{cargoUnitID}":
        return await saveCargoUnit(event);
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
