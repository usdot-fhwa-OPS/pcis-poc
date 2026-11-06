import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    familyName: {
      mutable: true,
      required: true
    },
    phoneNumber: {
      mutable: true,
      required: true,
    }, 
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
    "custom:organization": {
      dataType: "String",
      mutable: true,
    },
     "custom:terminalId": {
      dataType: "String",
      mutable: true,
    },
  }
});
