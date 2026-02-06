import { Authenticator, SelectField, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

import '@aws-amplify/ui-react/styles.css';
import './authStyles.css';

Amplify.configure(outputs);
I18n.putVocabularies(translations);
I18n.setLanguage('en');

I18n.putVocabularies({
  en: {
    "Given Name": "First Name",
    "Enter your Given Name": "Enter your First Name",
    "Family Name": "Last Name",
    "Enter your Family Name": "Enter your Last Name",
    "username is required to signUp":"Email is required to signUp",
    "Attributes did not conform to the schema: phoneNumbers: The attribute phoneNumbers is required, name.formatted: The attribute name.formatted is required":"Phone Number and Full Name are required to signUp",
    "Attributes did not conform to the schema: name.formatted: The attribute name.formatted is required": "Full name is required to signUp",
    "Attributes did not conform to the schema: phoneNumbers: The attribute phoneNumbers is required": "Phone number is required to signUp"
  },
});

const formFields = {
  signUp: {
    given_name: { order: 1 },
    family_name: { order: 2 },
    email: { order: 3 },
    phone_number: { order: 4 },
    password: { order: 5 },
    confirm_password: { order: 6 },
  },
};

const roleOptions = [
  <option key="Beneficiary Cargo Owner" value="Beneficiary Cargo Owner">Beneficiary Cargo Owner</option>,
  <option key="Transportation Operator" value="Transportation Operator">Transportation Operator</option>,
  <option key="Terminal Operator" value="Terminal Operator">Terminal Operator</option>,
];

const orgOptions = [
  <option key="Leidos" value="Leidos">Leidos</option>,
];

const Auth = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticator
      className="amplify-authenticator"
      loginMechanisms={['email']}
      formFields={formFields}
      components={{
        SignUp: {
          FormFields() {
            return (
              <>
                {/* Re-use default `Authenticator.SignUp.FormFields` */}
                <Authenticator.SignUp.FormFields />

                {/* Append custom fields */}
                <SelectField className="amplify-field" label="Role" name="custom:role" required>
                  {roleOptions}
                </SelectField>

                <SelectField className="amplify-field" label="Your Organization" name="custom:organization" required>
                  {orgOptions}
                </SelectField>
              </>
            );
          },
        },
      }}
    >
      {children}
    </Authenticator>
  );
};

export default Auth;