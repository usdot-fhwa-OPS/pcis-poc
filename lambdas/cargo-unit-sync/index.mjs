import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
const connectIdList = [];
const realTimeEventNotify = async(message) =>{

  const callbackUrl = `https://n7w79iw8p7.execute-api.us-east-1.amazonaws.com/dev/`;
  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });
  console.log(connectIdList)
  for (const id of connectIdList) {
    try {

      const requestParams = {
        ConnectionId: id,
        Data: message,
      };

      const command = new PostToConnectionCommand(requestParams);

      await client.send(command);
      console.log(`notified connection ID ${id} ${message}`)
    } catch (error) {
      console.log(error);
    }

  }


}


export const handler = async(event, context) => {
  console.log(event )
   

  //  //for websocket connect and disconnet events
    if(event["requestContext"]){
      const connectId = event["requestContext"]["connectionId"]
      const domainName = event["requestContext"]["domainName"]
      const stageName = event["requestContext"]["stage"]
      const qs = event['queryStringParameters']
       console.log('Connection ID: ', connectId, 'Domain Name: ', domainName, 'Stage Name: ', stageName, 'Query Strings: ', qs )
          const eventType = event["requestContext"]["eventType"];
      if('CONNECT' === eventType){

        connectIdList.push(connectId);

      }else if('DISCONNECT' === eventType){

        connectIdList.splice(connectIdList.indexOf(connectId), 1);
      }
    }

  // for database trigger  
  if (event.Records) {
    for (const record of event.Records) {
      await realTimeEventNotify(`${record.eventName} ${CARGO_UNITS_TABLE}`)
    }

  }

  return {"statusCode" : 200}
};