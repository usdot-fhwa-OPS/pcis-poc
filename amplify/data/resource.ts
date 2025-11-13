import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Container: a
    .model({
      vesselID: a.string(),
      containerID: a.string().required(),
      bcoName: a.string(),
      bcoEmail: a.string(),
      origin: a.string(),
      destination: a.string(),
      arrivalDate: a.string(),
      transopName: a.string(),
      transopEmail: a.string(),
      containerStatus: a.string().default('On-Ship'),
      assignmentDate: a.string(),
      reservationStatus: a.string().default('unassigned'),
      reservationDate: a.string(),
      reservationTime: a.string(),
      modifiedReservationDate: a.string(),
      modifiedReservationTime: a.string(),
      resLatestUpdateDate: a.string(),
      resApprovalDate: a.string(),
      resPickupDate: a.string(),
      flag: a.boolean().default(false),
      isTransportationNotify: a.boolean().default(false),
      isBCONotify: a.boolean().default(false),
      isTerminalNotify: a.boolean().default(false),
    })
    .identifier(['containerID'])
    .authorization((allow) => [allow.publicApiKey(),]),
  Limit: a
    .model({
      portCapacity: a.integer().required().default(3),
    })
    .authorization((allow) => [allow.publicApiKey(),]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});


/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
