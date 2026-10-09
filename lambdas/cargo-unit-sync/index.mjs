import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
const dynamo = new DynamoDBClient({});


// The frontend (src/components/real-time-call.tsx) matches on "<eventName> CargoUnits",
// so the broadcast name is fixed and independent of the physical table name.
const CARGO_UNITS_EVENT_SOURCE = "CargoUnits";
const WEBSOCKET_CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || "PcisWebsocketConn"
const callbackUrl = `https://n7w79iw8p7.execute-api.us-east-1.amazonaws.com/dev/`;
const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

const listWebSocketConnections = async () => {
  const connections = [];
  let ExclusiveStartKey;
  do {
    const scanData = await dynamo.send(new ScanCommand({ TableName: WEBSOCKET_CONNECTIONS_TABLE, ExclusiveStartKey }));
    connections.push(...scanData.Items.map(item => item.connectionId.S));
    ExclusiveStartKey = scanData.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return connections;
}

const realTimeEventNotify = async (message) => {

  const connections = await listWebSocketConnections();
  console.log(`sending "${message}" to ${connections.length} connections`)

  // allSettled so one dead connection can't fail the invocation; a failed invocation
  // makes the DynamoDB stream retry this batch and blocks all later updates.
  const results = await Promise.allSettled(connections.map((connectionId) =>
    client.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: message }))
  ));

  await Promise.all(results.map(async (result, i) => {
    if (result.status === "fulfilled") return;
    const connectionId = connections[i];
    const error = result.reason;
    if (error?.name === "GoneException" || error?.$metadata?.httpStatusCode === 410) {
      console.log(`removing stale connection ID ${connectionId}`)
      await removeWebSocketConnection(connectionId);
    } else {
      console.log(`failed to notify connection ID ${connectionId}`, error);
    }
  }));

  console.log(`notified all users`)

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
    // Clients refetch everything on any message, so one broadcast per event type per batch is enough.
    const eventNames = new Set(event.Records.map(record => record.eventName));
    for (const eventName of eventNames) {
      try {
        await realTimeEventNotify(`${eventName} ${CARGO_UNITS_EVENT_SOURCE}`)
      } catch (error) {
        // Real-time notifications are best effort; never block the stream on them.
        console.log(`failed to broadcast ${eventName}`, error);
      }
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
