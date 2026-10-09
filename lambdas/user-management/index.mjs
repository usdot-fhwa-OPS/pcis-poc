import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

// Initialize the cognitoClient outside the handler to enable TCP connection reuse

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_ODcx7VXFP';

const listUsers = async (event) => {
  try {
    if (!USER_POOL_ID) {
      throw new Error("Missing USER_POOL_ID environment variable.");
    }

    let allUsers = [];
    let paginationToken = null;

    // Loop to handle paginated results if there are many users
    do {
      const params = {
        UserPoolId: USER_POOL_ID,
        PaginationToken: paginationToken,
        Limit: 60, // Maximum allowed limit by AWS Cognito is 60
      };

      const command = new ListUsersCommand(params);
      const response = await cognitoClient.send(command);

      if (response.Users) {

        allUsers.push(...response.Users.map(user => {
          const attributes = {};
          user.Attributes.map(attr => attributes[attr.Name]=attr.Value)
          return {
            Username: user.Username,
            ...attributes
            
          }
        }));
      }

      // If a token is returned, more users exist
      paginationToken = response.PaginationToken;
    } while (paginationToken);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: `Successfully retrieved ${allUsers.length} users.`,
        users: allUsers
      }),
    };

  } catch (error) {
    console.error("Error listing Cognito users:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: error.message || "Internal Server Error"
      }),
    };
  }
};
import { 
   
  AdminEnableUserCommand 
} from "@aws-sdk/client-cognito-identity-provider";


const enable = async (event) => {
  const username = event.queryStringParameters?.username || event.body?.username; 

  if (!username) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Username is required." }),
    };
  }

  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
  };

  try {
    const command = new AdminEnableUserCommand(params);
    await cognitoClient.send(command);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: `User ${username} enabled successfully.` }),
    };
  } catch (error) {
    console.error("Error enabling user:", error);
    
    return {
      statusCode:  500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        message: "Failed to enable user.", 
        error: error.message 
      }),
    };
  }
};

import {  AdminDisableUserCommand } from "@aws-sdk/client-cognito-identity-provider";


const disable = async (event) => {
    // Assumptions: Passing UserPoolId and Username via the API gateway/invocation payload
    const username = event.queryStringParameters?.username || event.body?.username; 


    if (!username) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: "Missing userPoolId or username parameter." }),
        };
    }

    const input = {
        UserPoolId: USER_POOL_ID, // Required
        Username: username,     // Required
    };

    try {
        const command = new AdminDisableUserCommand(input);
        const response = await cognitoClient.send(command);
        
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                message: `User ${username} has been successfully disabled.`,
            }),
        };
    } catch (error) {
        console.error("Error disabling user:", error);
        return {
            statusCode:  500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                message: "Failed to disable user.", 
                error: error.message 
            }),
        };
    }
};

import {  AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";


const deleteUser = async (event) => {
    const username = event.queryStringParameters?.username || event.body?.username; 


    if (!username) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: "Missing required Username or UserPoolId" }),
        };
    }

    const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
    });

    try {
        await cognitoClient.send(command);
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: `Successfully deleted user ${username}` }),
        };
    } catch (error) {
        console.error("Error deleting user:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: error.message || "Failed to delete user" }),
        };
    }
};


import {  AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";


//Name and Email Address.
const update = async (event) => {
  const username = event.queryStringParameters?.username || event.body?.username;
  const givenName = event.queryStringParameters?.givenname || event.body?.givenname;
  const familyName = event.queryStringParameters?.familyname || event.body?.familyname;
  const email = event.queryStringParameters?.email || event.body?.email;

  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: []
  };
  if (givenName) {
    params.UserAttributes.push({
      Name: "family_name",
      Value: familyName
    })
  }
  if (familyName) {
    params.UserAttributes.push({
      Name: "given_name",
      Value: givenName
    })
  }
  if (email) {
    params.UserAttributes.push({
      Name: "email",
      Value: email
    })
  }





  try {
    const command = new AdminUpdateUserAttributesCommand(params);
    const response = await cognitoClient.send(command);

    return {
      headers: CORS_HEADERS,
      statusCode: 200,
      body: JSON.stringify({ message: "Attributes updated successfully", response })
    };
  } catch (error) {
    console.error("Error updating user attributes:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message })
    };
  }
};


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




export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    const routeKey = getRouteKey(event);

    switch (routeKey) {
      case "GET /listUsers":
        return await listUsers(event);
      case "POST /enableUser":
        return await enable(event);
      case "POST /disableUser":
        return await disable(event);
      case "POST /updateUser":
        return await update(event);
      case "POST /deleteUser":
        return await deleteUser(event);
      
      default:
        return response(404, { message: `Unsupported route: ${routeKey}` });
    }
  } catch (err) {
    

    console.error("pcis-user-managenent error:", err);
    return response(500, { message: err?.message || "Internal server error" });
  }
};

