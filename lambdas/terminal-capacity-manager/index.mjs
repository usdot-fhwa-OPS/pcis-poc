import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "TerminalCapacity";

export const handler = async (event, context) => {
  console.log(event);
  console.log(context)
  
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type'
        
  };
    if(event.requestContext && event.requestContext.resourcePath && event.httpMethod){
      event.routeKey = event.httpMethod +" "+ event.requestContext.resourcePath;
    }
  try {
    switch (event.routeKey) {
      case "DELETE /terminalCapacity/{capacityId}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              capacityId: event.pathParameters.capacityId,
            },
          })
        );
        body = `Deleted item ${event.pathParameters.capacityId}`;
        break;
      case "GET /terminalCapacity/{capacityId}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              capacityId: event.pathParameters.capacityId,
            },
          })
        );
        body = body.Item;
        break;
      case "GET /terminalCapacityList":
        body = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );
        body = body.Items;
        break;
      case "PUT /terminalCapacity":
        let requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: 
              requestJSON
            
            
            	
          })
        );
        body = `Put item ${requestJSON.capacityId}`;
        break;
      case "GET /terminalCapacity/expiredTempSchedules":
        body = await getExpiredSchedules(dynamo);
        body = body.Items;
        break;
      case "GET /terminalCapacity/regular":
        body = await getRegularTerminalCapacity(dynamo);
        body = body.Items;
        break;
      case "GET /terminalCapacity/temporary":
        body = await getTemporaryTerminalCapacity(dynamo);
        body = body.Items;
        break;
          default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    console.log(err);
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};

/**
 * Gets all temporary terminal capality schedules with end date greater than today
 * 
 * @param {DynamoDBDocumentClient} dynamoDBClient - DynamoDBDocumentClient
 * @returns {Promise<Object>} - The query response
 */
export async function getExpiredSchedules(dynamoDBClient) {
  try {
    const today = new Date();

    const formattedTodayDate = today.toISOString();
	const tableName = "TerminalCapacity";

    // Construct the query input
    const input = {
      TableName: tableName,
      FilterExpression: 'capacityType = :capacityTypeVal AND endDate < :endDateVal',
      
      ExpressionAttributeValues: {
        ":capacityTypeVal": "TEMPORARY" ,
        ":endDateVal": formattedTodayDate 
      }
    };
    console.log(input);
    // Execute the query
    const command = new ScanCommand(input);
    //console.log(command);
    const body =  await dynamoDBClient.send(command);
    return body;
  } catch (error) {
    console.error(`Error in Gets all temporary terminal capality schedules with end date greater than today: ${error}`);
    throw error;
  }

}

export async function getRegularTerminalCapacity(dynamoDBClient) {
  try {
    const today = new Date();

  const tableName = "TerminalCapacity";

    // Construct the query input
    const input = {
      TableName: tableName,
      FilterExpression: 'capacityType = :capacityTypeVal',
      
      ExpressionAttributeValues: {
        ":capacityTypeVal": "MAXIMUM" ,
      }
    };
    console.log(input);
    // Execute the query
    const command = new ScanCommand(input);
    //console.log(command);
    const body =  await dynamoDBClient.send(command);
    return body;
  } catch (error) {
    console.error(`Error in Gets all Regular Terminal Capacity: ${error}`);
    throw error;
  }  
}

export async function getTemporaryTerminalCapacity(dynamoDBClient) {
  try {
    const today = new Date();

  const tableName = "TerminalCapacity";

    // Construct the query input
    const input = {
      TableName: tableName,
      FilterExpression: 'capacityType = :capacityTypeVal',
      
      ExpressionAttributeValues: {
        ":capacityTypeVal": "TEMPORARY" ,
      }
    };
    console.log(input);
    // Execute the query
    const command = new ScanCommand(input);
    //console.log(command);
    const body =  await dynamoDBClient.send(command);
    return body;
  } catch (error) {
    console.error(`Error in Gets all Temporary Terminal Capacity: ${error}`);
    throw error;
  }  
}

