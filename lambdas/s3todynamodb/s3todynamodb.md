# S3 to DynamboDB Lambda Function

Create the Lambda Function for extracting data from S3 file uploads. For this you'll need the AWS S3 Bucket ARN and the AWS DynamoDB Table ARN that were created by AWS Amplify. Both can be found within their respective resource consoles.

Using the code, located in the **S3ToDynamoDB.zip** file within the same folder, create a Lambda function in AWS that contains a AWS S3 trigger. The S3 trigger should have the following properties

- Bucket arn: your_s3_arn
- Event type(s): s3:ObjectCreated:*

It should also include the following environment variable

- Key: DYNAMODB_TABLE
- Value: your_dynamodb_arn