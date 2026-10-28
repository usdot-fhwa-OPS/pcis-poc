import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";


const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE || "Reservations";
const RESERVATION_EVENTS_TABLE = process.env.RESERVATION_EVENTS_TABLE || "ReservationEvents";
const RESERVATION_MOVES_TABLE = process.env.RESERVATION_MOVES || "ReservationMoves";
const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
const RESERVATION_EVENTS_GSI = process.env.RESERVATION_EVENTS_GSI || "GSI_reservationId";
const RESERVATION_MOVES_GSI = process.env.RESERVATION_MOVES_GSI || "GSI_reservationId";


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



async function listReservations(event) {
  
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
  const body = event.body
  if (body) {
    const params = JSON.parse(body);
    if (params.reservationId) {
      expressionNames["#reservationId"] = "reservationId";
      expressionValues[":reservationId"] = params.reservationId;
      clauses.push("#reservationId = :reservationId");
    }
    if (params.confirmationCode) {
      expressionNames["#confirmationCode"] = "confirmationCode";
      expressionValues[":confirmationCode"] = params.confirmationCode;
      clauses.push("#confirmationCode = :confirmationCode");
    }
    if (params.terminalId) {
      expressionNames["#terminalId"] = "terminalId";
      expressionValues[":terminalId"] = params.terminalId;
      clauses.push("#terminalId = :terminalId");
    }
    if (params.endAt) {
      expressionNames["#endAt"] = "endAt";
      expressionValues[":endAt"] = params.endAt;
      clauses.push("#endAt = :endAt");
    }
    if (params.executingUserEmail) {
      expressionNames["#executingUserEmail"] = "executingUserEmail";
      expressionValues[":executingUserEmail"] = params.executingUserEmail;
      clauses.push("#executingUserEmail = :executingUserEmail");
    }
    if (params.modifiedByTerminal) {
      expressionNames["#modifiedByTerminal"] = "modifiedByTerminal";
      expressionValues[":modifiedByTerminal"] = params.modifiedByTerminal;
      clauses.push("#modifiedByTerminal = :modifiedByTerminal");
    }
    if (params.preferredStartAt) {
      expressionNames["#preferredStartAt"] = "preferredStartAt";
      expressionValues[":preferredStartAt"] = params.preferredStartAt;
      clauses.push("#preferredStartAt = :preferredStartAt");
    }
    if (params.requestingUserEmail) {
      expressionNames["#requestingUserEmail"] = "requestingUserEmail";
      expressionValues[":requestingUserEmail"] = params.requestingUserEmail;
      clauses.push("#requestingUserEmail = :requestingUserEmail");
    }
    if (params.startAt) {
      expressionNames["#startAt"] = "startAt";
      expressionValues[":startAt"] = params.startAt;
      clauses.push("#startAt = :startAt");
    }
    if (params.status) {
      expressionNames["#status"] = "status";
      expressionValues[":status"] = params.status;
      clauses.push("#status = :status");
    }
  }
 
  

  const scanInput = {
    TableName: RESERVATIONS_TABLE,
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


const getCargoUnit = async (cargoUnitID) => {
    
    const params = {
        TableName: CARGO_UNITS_TABLE,
        KeyConditionExpression: "cargoUnitID  = :cargoUnitIDValue",
        ExpressionAttributeValues: {
            ":cargoUnitIDValue": cargoUnitID,
        },
    };

    try {
        const command = new QueryCommand(params);
        const response = await dynamo.send(command);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Query successful",
                items: response.Items, // Automatically unmarshalled plain JS objects
                count: response.Count
            }),
        };
    } catch (error) {
        console.error("DynamoDB Query Error: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to query table",
                error: error.message
            }),
        };
    }
};


async function getReservationByConfirmationCode(event) {

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
  const confirmationCode = event.queryStringParameters?.confirmationCode;
  if (confirmationCode) {
    expressionNames["#confirmationCode"] = "confirmationCode";
    expressionValues[":confirmationCode"] = confirmationCode;
    clauses.push("#confirmationCode = :confirmationCode");
  }



  const scanInput = {
    TableName: RESERVATIONS_TABLE,
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
  const combinedList =  await Promise.all(items.map(async item => {
    const reservationMoveList = await listReservationMoves({ 'reservationId': item.reservationId })
    const body = JSON.parse(reservationMoveList.body)
    const updatedItems = await Promise.all(body.items.map(async move => {
      const cargoUnitList = await getCargoUnit(move.cargoUnitID)
      return ({...item, 'cargoUnitList':JSON.parse(cargoUnitList.body).items})
    }))
    return (updatedItems)
  }))
  return response(200, {
    combinedList,
    count: combinedList.length,
    nextToken: encodeNextToken(result.LastEvaluatedKey),
  });
}

async function listReservationMoves(event) {
  
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
  const body = event.body
  if (body) {
    const params = JSON.parse(body);
    if (params.moveId) {
      expressionNames["#moveId"] = "moveId";
      expressionValues[":moveId"] = params.moveId;
      clauses.push("#moveId = :moveId");
    }
    if (params.cargoUnitID) {
      expressionNames["#cargoUnitID"] = "cargoUnitID";
      expressionValues[":cargoUnitID"] = params.cargoUnitID;
      clauses.push("#cargoUnitID = :cargoUnitID");
    }
    if (params.equipmentType) {
      expressionNames["#equipmentType"] = "equipmentType";
      expressionValues[":equipmentType"] = params.equipmentType;
      clauses.push("#equipmentType = :equipmentType");
    }
    if (params.moveType) {
      expressionNames["#moveType"] = "moveType";
      expressionValues[":moveType"] = params.moveType;
      clauses.push("#moveType = :moveType");
    }
    if (params.reservationId) {
      expressionNames["#reservationId"] = "reservationId";
      expressionValues[":reservationId"] = params.reservationId;
      clauses.push("#reservationId = :reservationId");
    }
    if (params.status) {
      expressionNames["#status"] = "status";
      expressionValues[":status"] = params.status;
      clauses.push("#status = :status");
    }
    
  }
 
  

  const scanInput = {
    TableName: RESERVATION_MOVES_TABLE,
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

async function listReservationEvents(event) {
  
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
  const body = event.body
  if (body) {
    const params = JSON.parse(body);
    if (params.eventId) {
      expressionNames["#eventId"] = "eventId";
      expressionValues[":eventId"] = params.eventId;
      clauses.push("#eventId = :eventId");
    }
    if (params.actorEmail) {
      expressionNames["#actorEmail"] = "actorEmail";
      expressionValues[":actorEmail"] = params.actorEmail;
      clauses.push("#actorEmail = :actorEmail");
    }
    if (params.reservationId) {
      expressionNames["#reservationId"] = "reservationId";
      expressionValues[":reservationId"] = params.reservationId;
      clauses.push("#reservationId = :reservationId");
    }
    
    if (params.type) {
      expressionNames["#type"] = "type";
      expressionValues[":type"] = params.type;
      clauses.push("#type = :type");
    }
    
  }
 
  

  const scanInput = {
    TableName: RESERVATION_EVENTS_TABLE,
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

/**
 * Generates a random alphanumeric string of a given length.
 * @param {number} length - The desired length of the string.
 * @returns {string} The random alphanumeric string.
 */
export function generateRandomString(length) {
   // Define the allowed alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate cryptographically secure random bytes
    const bytes = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        // Map each random byte to a character in our alphabet
        result += chars[bytes[i] % chars.length];
    }
    return result;
}



async function createReservation(event) {
  const body = event.body
  if (!body) return response(400, { message: "Reservation Information is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);
  record.reservationId = uuidv4()
  record.confirmationCode = 'PCIS-' + generateRandomString(4) + '-' + generateRandomString(4)

  record.createdAt = nowIso;


  const result = await dynamo.send(
    new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: record,
    })
  );
  return response(200, {'reservationId':record.reservationId,'confirmationCode': record.confirmationCode});
}


async function saveReservation(event) {
  const body = event.body
  if (!body) return response(400, { message: "Reservation Information is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);

  const existingRec = await dynamo.send(
    new GetCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservationId: record.reservationId },
    })
  );
  let existingRecItem = existingRec.Item; 
  if (existingRecItem) {
    existingRecItem.updatedAt = nowIso;
    Object.keys(record).forEach(key => {
      existingRecItem[key] = record[key];
    });
    record = existingRecItem;
  } else {
    return response(200, {message:`Existing record not found for ${body}`});

  }
  const result = await dynamo.send(
    new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: record,
    })
  );
  return response(200, result);
}


async function createReservationMove(event) {
  const body = event.body
  if (!body) return response(400, { message: "Reservation Move Information is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);
  record.moveId = uuidv4()

  record.createdAt = nowIso;


  const result = await dynamo.send(
    new PutCommand({
      TableName: RESERVATION_MOVES_TABLE,
      Item: record,
    })
  );
  return response(200, {'moveId':record.moveId});
}


async function saveReservationMove(event) {
  const body = event.body
  if (!body) return response(400, { message: "Reservation Move Information is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);

  const existingRec = await dynamo.send(
    new GetCommand({
      TableName: RESERVATION_MOVES_TABLE,
      Key: { moveId: record.moveId },
    })
  );
  let existingRecItem = existingRec.Item; 
  if (existingRecItem) {
    existingRecItem.updatedAt = nowIso;
    Object.keys(record).forEach(key => {
      existingRecItem[key] = record[key];
    });
    record = existingRecItem;
  } else {
    return response(200, {message:`Existing record not found for ${body}`});

  }
  const result = await dynamo.send(
    new PutCommand({
      TableName: RESERVATION_MOVES_TABLE,
      Item: record,
    })
  );
  return response(200, result);
}

async function createReservationEvent(event) {
  const body = event.body
  if (!body) return response(400, { message: "Reservation Event Information is required" });
  const nowIso = new Date().toISOString();
  let record = JSON.parse(body);
  record.eventId = uuidv4()

  record.createdAt = nowIso;


  const result = await dynamo.send(
    new PutCommand({
      TableName: RESERVATION_EVENTS_TABLE,
      Item: record,
    })
  );
  return response(200, {'eventId':record.eventId});
}


async function deleteReservationMove(event) {
  const moveId = event.queryStringParameters?.moveId;
  if (!moveId) return response(400, { message: "Reservation Move ID is required" });

  const result = await dynamo.send(
    new DeleteCommand({
      TableName: RESERVATION_MOVES_TABLE,
      Key: {
        moveId: moveId,
      },
      // Optional: Return the item attributes as they appeared before deletion
      ReturnValues: "ALL_OLD",
    }));


  return response(200, result);
}

async function deleteReservation(event) {
  const reservationId = event.queryStringParameters?.reservationId;
  if (!reservationId) return response(400, { message: "Reservation ID is required" });

  const result = await dynamo.send(
    new DeleteCommand({
      TableName: RESERVATIONS_TABLE,
      Key: {
        reservationId: reservationId,
      },
      // Optional: Return the item attributes as they appeared before deletion
      ReturnValues: "ALL_OLD",
    }));


  return response(200, result);
}

async function getAllReservationMoveByReservationId(reservationId) {

  try {
    const queryParams = {
      TableName: RESERVATION_MOVES_TABLE,
      IndexName: RESERVATION_MOVES_GSI,
      KeyConditionExpression: "reservationId  = :val",
      ExpressionAttributeValues: {
        ":val": reservationId,
      },
    };

    const queryResponse = await dynamo.send(new QueryCommand(queryParams));
    const items = queryResponse.Items || [];

    if (items.length === 0) {
      return { statusCode: 200, body: "No items found matching the index value." };
    }

    return items;
  } catch (error) {
    console.error("Error executing deletion operation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
}

async function getAllReservationEventByReservationId(reservationId) {

  try {
    const queryParams = {
      TableName: RESERVATION_EVENTS_TABLE,
      IndexName: RESERVATION_EVENTS_GSI,
      KeyConditionExpression: "reservationId  = :val",
      ExpressionAttributeValues: {
        ":val": reservationId,
      },
    };

    const queryResponse = await dynamo.send(new QueryCommand(queryParams));
    const items = queryResponse.Items || [];

    if (items.length === 0) {
      return { statusCode: 200, body: "No items found matching the index value." };
    }

    return items;
  } catch (error) {
    console.error("Error executing deletion operation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
}

async function deleteCompleteReservation(event) {
  const reservationId = event.queryStringParameters?.reservationId;
  if (!reservationId) return response(400, { message: "Reservation ID is required" });

  const txnItems = [
      {
        Delete: {
          TableName: RESERVATIONS_TABLE,
          Key: {
            reservationId: reservationId,
          },
          // Optional: Return the item attributes as they appeared before deletion
          ReturnValues: "ALL_OLD",
        }
      }
    ]

    const reservationMovesItems = await getAllReservationMoveByReservationId(reservationId);
    reservationMovesItems.map(item=>{
      txnItems.push({
        Delete: {
          TableName: RESERVATION_MOVES_TABLE,
          Key: {
            moveId: item.moveId,
          },
          // Optional: Return the item attributes as they appeared before deletion
          ReturnValues: "ALL_OLD",
        }
      })
    })

    const reservationEventItems = await getAllReservationEventByReservationId(reservationId);
    reservationEventItems.map(item=>{
      txnItems.push({
        Delete: {
          TableName: RESERVATION_EVENTS_TABLE,
          Key: {
            eventId: item.eventId,
          },
          // Optional: Return the item attributes as they appeared before deletion
          ReturnValues: "ALL_OLD",
        }
      })
    })

  
  const command = new TransactWriteCommand({
    TransactItems: txnItems
  })

  const result = await dynamo.send(command);


  return response(200, result);
}


async function deleteReservationEvent(event) {
  const eventId = event.queryStringParameters?.eventId;
  if (!eventId) return response(400, { message: "Reservation Event ID is required" });

  const result = await dynamo.send(
    new DeleteCommand({
      TableName: RESERVATION_EVENTS_TABLE,
      Key: {
        eventId: eventId,
      },
      // Optional: Return the item attributes as they appeared before deletion
      ReturnValues: "ALL_OLD",
    }));


  return response(200, result);
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    const routeKey = getRouteKey(event);

    switch (routeKey) {
      
      case "PUT /createReservation":
        return await createReservation(event);
      case "POST /saveReservation":
        return await saveReservation(event);
      case "PUT /createReservationMove":
        return await createReservationMove(event);
      case "POST /saveReservationMove":
        return await saveReservationMove(event);
      case "PUT /createReservationEvent":
        return await createReservationEvent(event);
      case "POST /listReservations":
        return await listReservations(event);
      case "POST /listReservationMoves":
        return await listReservationMoves(event);
      case "POST /listReservationEvents":
        return await listReservationEvents(event);
      case "DELETE /deleteReservationMove":
        return await deleteReservationMove(event);
      case "DELETE /deleteReservationEvent":
        return await deleteReservationEvent(event);
      case "DELETE /deleteReservation":
        return await deleteReservation(event);
      case "GET /getReservationByConfirmationCode":
        return await getReservationByConfirmationCode(event);
      case "DELETE /deleteCompleteReservation":
        return await deleteCompleteReservation(event);

      
      default:
        return response(404, { message: `Unsupported route: ${routeKey}` });
    }
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: "Reservation not found" });
    }

    console.error("reservation-manager error:", err);
    return response(500, { message: err?.message || "Internal server error" });
  }
};
