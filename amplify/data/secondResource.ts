import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const limitSchema = a.schema({
  Limit: a
    .model({
      portCapacity: a.integer().required().default(3),
    })
  .identifier(['portCapacity'])
  .authorization((allow) => [allow.publicApiKey(),]),
})

export type LimitSchema = ClientSchema<typeof limitSchema>;

export const limitData = defineData({
  schema: limitSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});