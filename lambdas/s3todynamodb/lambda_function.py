import boto3
import csv
import os
import json
from io import StringIO
from urllib.parse import unquote_plus
from botocore.exceptions import ClientError
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')


def clean_value(value):
    if value is None:
        return ""
    return str(value).strip()


def remove_empty_attributes(item):
    """
    Remove attributes whose value is an empty string.
    This helps avoid DynamoDB ValidationException on GSI/table key fields.
    """
    return {k: v for k, v in item.items() if v != ""}


def lambda_handler(event, context):
    primary_table_name = os.environ['DYNAMODB_TABLE']
    second_table_name = os.environ['SECOND_DYNAMODB_TABLE']

    primary_table = dynamodb.Table(primary_table_name)
    second_table = dynamodb.Table(second_table_name)

    print("Received event:", json.dumps(event))

    for record in event.get('Records', []):
        bucket_name = record['s3']['bucket']['name']
        raw_file_key = record['s3']['object']['key']
        file_key = unquote_plus(raw_file_key)

        print(f"Bucket: {bucket_name}")
        print(f"Raw key: {raw_file_key}")
        print(f"Decoded key: {file_key}")

        file_creation_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        try:
            s3_response = s3.get_object(Bucket=bucket_name, Key=file_key)
        except ClientError as e:
            print(f"get_object failed for key '{file_key}': {str(e)}")
            raise

        content = s3_response['Body'].read().decode('utf-8')
        csv_reader = csv.DictReader(StringIO(content))

        inserted_count = 0
        skipped_count = 0

        with primary_table.batch_writer() as primary_batch, second_table.batch_writer() as second_batch:
            for row in csv_reader:
                cleaned_row = {}
                for key, value in row.items():
                    cleaned_key = clean_value(key)
                    cleaned_value = clean_value(value)
                    cleaned_row[cleaned_key] = cleaned_value

                # Skip fully empty rows
                if not any(cleaned_row.values()):
                    skipped_count += 1
                    continue

                # cargoUnitID is required for CargoUnits partition key
                if not cleaned_row.get('cargoUnitID'):
                    print(f"Skipping row because cargoUnitID missing: {cleaned_row}")
                    skipped_count += 1
                    continue

                # Fill timestamps if missing
                if not cleaned_row.get('createdAt'):
                    cleaned_row['createdAt'] = file_creation_time
                if not cleaned_row.get('updatedAt'):
                    cleaned_row['updatedAt'] = file_creation_time

                # Defaults for important fields
                if not cleaned_row.get('bookingStatus'):
                    cleaned_row['bookingStatus'] = 'unassigned'

                if not cleaned_row.get('containerStatus'):
                    cleaned_row['containerStatus'] = 'On-Ship'

                # New cargo starts unassigned so it shows in the BCO's Upcoming list (fetchBcoUpcoming).
                if not cleaned_row.get('reservationStatus'):
                    cleaned_row['reservationStatus'] = 'unassigned'

                if not cleaned_row.get('flag'):
                    cleaned_row['flag'] = 'FALSE'

                if not cleaned_row.get('isTransportationNotify'):
                    cleaned_row['isTransportationNotify'] = 'FALSE'

                if not cleaned_row.get('isBCONotify'):
                    cleaned_row['isBCONotify'] = 'FALSE'

                if not cleaned_row.get('isTerminalNotify'):
                    cleaned_row['isTerminalNotify'] = 'FALSE'

                cleaned_row['__typename'] = 'Container'

                # Remove empty-string attributes after defaults are set
                final_item = remove_empty_attributes(cleaned_row)

                # Write to both tables
                primary_batch.put_item(Item=final_item)
                second_batch.put_item(Item=final_item)

                inserted_count += 1

        print(
            f"Successfully processed '{file_key}'. "
            f"Inserted={inserted_count}, Skipped={skipped_count}"
        )

    return {
        'statusCode': 200,
        'body': json.dumps('Data import successful')
    }