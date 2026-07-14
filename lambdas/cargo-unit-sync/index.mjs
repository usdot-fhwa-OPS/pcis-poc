import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
const dynamo = new DynamoDBClient({});


const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
const WEBSOCKET_CONNECTIONS_TABLE = process.env.CARGO_UNITS_TABLE || "PcisWebsocketConn"
const realTimeEventNotify = async (message) => {

  const callbackUrl = `https://n7w79iw8p7.execute-api.us-east-1.amazonaws.com/dev/`;
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });
  const scanData = await dynamo.send(new ScanCommand({ TableName: WEBSOCKET_CONNECTIONS_TABLE }));
  const connections = scanData.Items.map(item => item.connectionId.S);

  console.log(connections)
  connections.map(async (connectionId) => {
    try {

      const requestParams = {
        ConnectionId: connectionId,
        Data: message,
      };

      const command = new PostToConnectionCommand(requestParams);
      console.log(`sending notification connection ID ${connectionId} ${message}`)
      await client.send(command)
      
      // await fetch(`${callbackUrl}/@connections/${connectionId}`, {
      //       method: 'POST',
      //       body: message,
            
      //   });

      console.log(`notified connection ID ${connectionId} ${message}`)

    } catch (error) {
      console.log(error);
      await removeWebSocketConnection(connectionId);
    }

  });


}


export const handler = async (event, context) => {
  console.log(event)


  //  //for websocket connect and disconnet events
  if (event["requestContext"]) {
    const connectionId = event["requestContext"]["connectionId"]
    const domainName = event["requestContext"]["domainName"]
    const stageName = event["requestContext"]["stage"]
    const qs = event['queryStringParameters']
    console.log('Connection ID: ', connectionId, 'Domain Name: ', domainName, 'Stage Name: ', stageName, 'Query Strings: ', qs)
    const eventType = event["requestContext"]["eventType"];
    if ('CONNECT' === eventType) {

      await dynamo.send(new PutItemCommand({
        TableName: WEBSOCKET_CONNECTIONS_TABLE,
        Item: { connectionId: { S: connectionId } }
      }));

    } else if ('DISCONNECT' === eventType) {

      await removeWebSocketConnection(connectionId);
    }
  }

  // for database trigger  
  if (event.Records) {
    for (const record of event.Records) {
      await realTimeEventNotify(`${record.eventName} ${CARGO_UNITS_TABLE}`)
    }

  }

  return { "statusCode": 200 }
};

async function removeWebSocketConnection(connectionId) {
  await dynamo.send(new DeleteItemCommand({
    TableName: WEBSOCKET_CONNECTIONS_TABLE,
    Key: { connectionId: { S: connectionId } }
  }));
}
