# List Tranportation Operators API/Lambda Function

Create a Lambda Function for recieving the list of Transportation Operators users within your AWS Cognito User Pool. For this you'll need the Cognito User Pool ID that was created by AWS Amplify. It can be found within the Cognito console.

Using the python code, located in the ListCognitoUsers.zip file, create a Lambda function in AWS. Replace line 56 of the Lambda's code with the User Pool ID with your own.

The Lambda function should have an AWS API Gateway trigger. First, create an API Gateway. Within the API Gateway console, follow these steps:

- Click ***Create API*** > Choose REST API > give name and and click ***Create API***.
- Click ***Create Method*** > Choose ***HTTP*** > Choose ***GET*** for ***Method Type*** > Give name > Click ***Create method***.
- Click ***Authorizers*** > ***Create Authorizer*** > give name and choose Cognito for ***Authorizer type*** > choose your Cognito User Pool
- Click ***Deploy API*** > navigate to ***Stages*** and copy your ***Invoke URL***.

Using that **invoke URL**, update the following lines of code within the project:
- src/routes/index.tsx, line 133.
- src/routes/operators.tsx, line 20.
- src/routes/reservation.tsx, line 122.

Ensure that these changes make it to the develop branch. Within the Amplify console, click into the deployment branch > click **Redeploy this version**.

Then create an API Gateway trigger for the Lambda function, which should have the following configuration:

- Trigger Source: API Gateway > use existing API > choose your Lambda Function.
- API Type: REST
- Authorization: COGNITO_USER_POOLS
- Method: GET