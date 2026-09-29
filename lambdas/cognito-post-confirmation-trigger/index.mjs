import { CognitoIdentityProviderClient, AdminDisableUserCommand, UserNotFoundException$, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import
const config = {}; // type is CognitoIdentityProviderClientConfig
const client = new CognitoIdentityProviderClient(config);

export const handler = async (event, context) => {
  console.log(event);

  if (event.userName) {
    const input = { // AdminDisableUserRequest
      UserPoolId: event.userPoolId,
      Username : event.userName,
    };
    const command = new AdminDisableUserCommand(input);
    const response = await client.send(command);

  }

  return event;

}