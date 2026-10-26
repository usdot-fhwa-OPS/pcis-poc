import { CognitoIdentityProviderClient, AdminDisableUserCommand, UserNotFoundException$, UserNotFoundException, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import
const config = {}; // type is CognitoIdentityProviderClientConfig
const client = new CognitoIdentityProviderClient(config);

export const handler = async (event, context) => {
  console.log(event);

  if (event.userName) {

    await addUserInGroup(event.userPoolId, event.userName, event.request.userAttributes['custom:role'])

    const input = { // AdminDisableUserRequest
      UserPoolId: event.userPoolId,
      Username: event.userName,
    };
    const command = new AdminDisableUserCommand(input);
    const response = await client.send(command);

  }

  return event;

}

const addUserInGroup = async (userPoolId, username, newGroupName) => {
  if (userPoolId && username && newGroupName) {
    const addCmd = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: 'pcis_' + newGroupName.replaceAll(' ', '_'),
    });
    await client.send(addCmd);

  }
}
