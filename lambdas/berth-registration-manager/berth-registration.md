# Berth Registration + Manifest Ingestion (Backend Only)

This Lambda implements:
- Berth request CRUD endpoints
- Terminal decision endpoint (approve/deny)
- Automatic CSV ingestion from request payload into DynamoDB when approved

## 1) DynamoDB Tables

Create three tables.

### A) `BerthRequests`

- Partition key: `requestId` (String)
- Capacity mode: On-demand

Example CLI:

```bash
aws dynamodb create-table \
  --table-name BerthRequests \
  --attribute-definitions AttributeName=requestId,AttributeType=S \
  --key-schema AttributeName=requestId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### B) `BerthManifestItems`

- Partition key: `berthRequestId` (String)
- Sort key: `rowKey` (String)
- Capacity mode: On-demand

Example CLI:

```bash
aws dynamodb create-table \
  --table-name BerthManifestItems \
  --attribute-definitions \
    AttributeName=berthRequestId,AttributeType=S \
    AttributeName=rowKey,AttributeType=S \
  --key-schema \
    AttributeName=berthRequestId,KeyType=HASH \
    AttributeName=rowKey,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### C) `BerthConfig`

- Partition key: `terminalId` (String)
- Capacity mode: On-demand

Example CLI:

```bash
aws dynamodb create-table \
  --table-name BerthConfig \
  --attribute-definitions AttributeName=terminalId,AttributeType=S \
  --key-schema AttributeName=terminalId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## 2) Lambda Setup

Source file:
- `index.mjs`

Runtime:
- Node.js 24.x

Environment variables:
- `BERTH_REQUESTS_TABLE=BerthRequests`
- `BERTH_MANIFEST_TABLE=BerthManifestItems`
- `BERTH_CONFIG_TABLE=BerthConfig`

Install dependencies before zipping:

```bash
cd lambdas/berth-registration-manager
npm install
```

## 3) Required IAM Permissions

The Lambda role needs:
- DynamoDB:
  - `dynamodb:GetItem`
  - `dynamodb:PutItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:Scan`
  - Resources: `BerthRequests`, `BerthManifestItems`, `BerthConfig`

## 4) API Gateway Routes

Create a REST API (or HTTP API) and map to this Lambda.

Supported routes:
- `GET /berthConfig`
- `PUT /berthConfig`
- `POST /berthRequests`
- `GET /berthRequests`
- `GET /berthRequests/{requestId}`
- `PUT /berthRequests/{requestId}`
- `POST /berthRequests/{requestId}/decision`
- `POST /berthRequests/{requestId}/arrival`
- `POST /berthRequests/{requestId}/departure`

Use Cognito authorizer if desired.

## 5) Request/Response Notes

### Create berth config (terminal manager)
`PUT /berthConfig`

Body example:

```json
{
  "terminalId": "DEFAULT_TERMINAL",
  "berthCapacity": 5,
  "assignmentMode": "DESIGNATIONS",
  "berthDesignations": ["15A", "North Gate", "Large Berth"]
}
```

### Read berth config
`GET /berthConfig?terminalId=DEFAULT_TERMINAL`

### Create request
`POST /berthRequests`

Body example:

```json
{
  "terminalId": "DEFAULT_TERMINAL",
  "vesselAgentEmail": "agent@example.com",
  "vesselID": "VSL-100",
  "berthAssignment": {
    "berthId": "15A",
    "designation": "15A"
  },
  "etaAt": "2026-03-30T14:00:00Z",
  "etdAt": "2026-03-30T20:00:00Z",
  "services": ["Food", "Water"],
  "manifestFileName": "manifest-100.csv",
  "manifestPath": "uploaded-by-ui/manifest-100.csv",
  "manifestCsvContent": "cargoUnitID,arrivalDate,bcoEmail,bcoName,containerStatus,destination,origin\\nCU-100,2026-03-30,bco@example.com,Jane Doe,On-Ship,Baltimore,NYC"
}
```

### Decide request (terminal)
`POST /berthRequests/{requestId}/decision`

Body:

```json
{
  "decision": "APPROVED"
}
```

or

```json
{
  "decision": "DENIED",
  "denialComment": "Window not available"
}
```

When approved:
- Lambda reads CSV content from the request record (`manifestCsvContent` or `manifestCsvBase64`)
- Parses rows
- Writes parsed row-level records to `BerthManifestItems`
- Updates berth request ingestion status

### Record ATA
`POST /berthRequests/{requestId}/arrival`

Body (optional):

```json
{
  "ataAt": "2026-03-30T16:00:00Z"
}
```

### Record ATD
`POST /berthRequests/{requestId}/departure`

Body (optional):

```json
{
  "atdAt": "2026-03-30T18:00:00Z"
}
```

### Paginated list
`GET /berthRequests?limit=25&nextToken=<token>&terminalId=DEFAULT_TERMINAL&status=PENDING`

## 6) Expected Manifest Columns

The CSV parser expects stow-plan-compatible fields (case-insensitive):
- `cargoUnitID`
- `arrivalDate`
- `bcoEmail`
- `bcoName`
- `containerStatus`
- `destination`
- `origin`
- optional: `vesselID`

Rows missing `cargoUnitID` are marked as failed in `BerthManifestItems`.
