  import { randomBytes } from 'crypto';
  import { v4 as uuidv4 } from "uuid";
  import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
  import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    ScanCommand,
    DeleteCommand,
    QueryCommand,
    TransactWriteCommand,
  } from "@aws-sdk/lib-dynamodb";
import { AdminGetUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';


  const TERMINAL_RESOURCES_TABLE = process.env.RESERVATIONS_TABLE || "TerminalResources";
  const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
  

  const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_ODcx7VXFP';
  

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



  async function createTerminalResource(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    record['createdAt'] = nowIso;
    record['createdBy'] = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: record,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }

  async function createEquipment(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    const terminalResource = {terminalId:record.terminalId, sk:record.entityType+'#'+record.equipmentType}
    terminalResource.record={...record}
    delete terminalResource.record.terminalId
    terminalResource.createdAt = nowIso;
    terminalResource.createdBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: terminalResource,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }

  async function createGang(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    const gangId = uuidv4();
    const entityType = 'GANG'
    const terminalResource = {terminalId:record.terminalId, sk:entityType+'#'+gangId}
    terminalResource.record={...record}
    delete terminalResource.record.terminalId
    terminalResource.record.entityType = entityType
    terminalResource.record.gangId = gangId
    terminalResource.createdAt = nowIso;
    terminalResource.createdBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: terminalResource,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }

  async function createUnit(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    const unitId = uuidv4();
    const entityType = 'UNIT'
    const terminalResource = {terminalId:record.terminalId, sk:entityType+'#'+unitId}
    terminalResource.record={...record}
    delete terminalResource.record.terminalId
    terminalResource.record.entityType = entityType
    terminalResource.record.unitId = unitId
    terminalResource.createdAt = nowIso;
    terminalResource.createdBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: terminalResource,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }

  async function createClosure(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    const entityType = 'CLOSURE'
    const terminalResource = {terminalId:record.terminalId, sk:entityType+'#'+record.date}
    terminalResource.record={...record}
    delete terminalResource.record.terminalId
    terminalResource.record.entityType = entityType
    terminalResource.createdAt = nowIso;
    terminalResource.createdBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: terminalResource,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }

  async function createOutage(event, userAttributes) {
    const body = event.body
    const record = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(record.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const nowIso = new Date().toISOString();
    
    
    const entityType = 'OUTAGE'
    const outageId = uuidv4()
    const terminalResource = {terminalId:record.terminalId, sk:entityType+'#'+outageId}
    terminalResource.record={...record}
    delete terminalResource.record.terminalId
    terminalResource.record.entityType = entityType
    terminalResource.record.outageId = outageId
    terminalResource.createdAt = nowIso;
    terminalResource.createdBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: terminalResource,
        ConditionExpression: "attribute_not_exists(terminalId)"
      })
    );
    return response(201, result);
  }


async function getTerminalResource(event, userAttributes) {
    const terminalId = userAttributes.attributes['custom:terminalId'];
    if (!terminalId) {
      return response(404, 'Terminal Resource not assigned to Terminal Operator');
    }

    const sk = event.queryStringParameters.sk;
    if(!sk){
      return response(400, 'Sort key is missing in HTTP request.');
    }
    
    const result = await dynamo.send(
      new GetCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Key: {terminalId: terminalId, sk: sk},
      })
    );
    if(result.Item){
return response(200, result.Item);
    }else{
      return response(404, `Terminal Resource for terminal Id ${terminalId} and sort ket ${sk} not found.`);
    }
    
  }

  async function saveTerminalResource(event, userAttributes) {
    const body = event.body
    const termRes = JSON.parse(body);
    if (!body) return response(400, { message: "Terminal Resource Information is required" });
    const terminalIdList = userAttributes.attributes['custom:terminalId'];
    if (!terminalIdList.includes(termRes.terminalId)) {
      return response(403, 'Access denied to Terminal Resource.');
    }
    const sk = termRes.sk;
    if(!sk){
      return response(400, 'Sort key is missing in request payload.');
    }
    
    const existingRecord = await dynamo.send(
      new GetCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Key: {terminalId: termRes.terminalId, sk: sk},
      })
    );
    if(!existingRecord.Item){
      return response(404, `Terminal Resource not found for terminal id ${termRes.terminalId} and sk ${sk}`);

    }

    
    
    const updatedRecord = {...existingRecord.Item}
    updatedRecord.record= {...existingRecord.Item.record, ...termRes.record}

    const nowIso = new Date().toISOString();
    updatedRecord.updatedAt = nowIso;
    updatedRecord.updatedBy = userAttributes.attributes.email;

    const result = await dynamo.send(
      new PutCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Item: updatedRecord,
      })
    );
    return response(200, result);
  }

  

async function deleteTerminalResource(event, userAttributes) {
  const terminalId = event.queryStringParameters?.terminalId;
  if (!terminalId) return response(400, { message: "Terminal ID is required" });

  const sk = event.queryStringParameters?.sk;
  if (!sk) return response(400, { message: "Sork key is required" });

  const terminalIdList = userAttributes.attributes['custom:terminalId'];
  if (!terminalIdList.includes(terminalId)) {
    return response(403, 'Access denied to Terminal Resource.');
  }

  const result = await dynamo.send(
    new DeleteCommand({
      TableName: TERMINAL_RESOURCES_TABLE,
      Key: {
        terminalId: terminalId,
        sk: sk
      },
      // Optional: Return the item attributes as they appeared before deletion
      ReturnValues: "ALL_OLD",
    }));


  return response(200, result);
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

function isTerminalOperator(cognitoGroups){
  return(cognitoGroups.includes('pcis_Terminal_Operator'))
}


  export const handler = async (event) => {
    try {
      if (event.httpMethod === "OPTIONS") {
        return response(200, { ok: true });
      }

       const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) {
      return { statusCode: 401, body: 'No authorization header' };
    }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const decoded = decodeJwtPayload(token);
  const userId = decoded.sub;
  const cognitoGroups = decoded['cognito:groups']

  const userAttributes = await getUserAttributes(userId);
      const routeKey = getRouteKey(event);

      switch (routeKey) {
        
        case "POST /createTerminalResource":
          return await createTerminalResource(event, userAttributes);
        case "GET /getTerminalResource":
          return await getTerminalResource(event, userAttributes);
        case "PUT /saveTerminalResource":
          return await saveTerminalResource(event, userAttributes);
        case "DELETE /deleteTerminalResource":
          return await deleteTerminalResource(event, userAttributes);
        case "POST /createEquipment":
          return await createEquipment(event, userAttributes);
        case "POST /createGang":
          return await createGang(event, userAttributes);
        case "POST /createUnit":
          return await createUnit(event, userAttributes);
        case "POST /createClosure":
          return await createClosure(event, userAttributes);
        case "POST /createOutage":
          return await createOutage(event, userAttributes);

          
        
        
        default:
          return response(404, { message: `Unsupported route: ${routeKey}` });
      }
    } catch (err) {
      if (err?.name === "ConditionalCheckFailedException") {
        return response(500, { "Terminal Resource Manager error.":err });
      }

      console.error("reservation-manager error:", err);
      return response(500, { message: err?.message || "Internal server error" });
    }
  };
