import { Authenticator, Button, SelectField, TextField, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

import '@aws-amplify/ui-react/styles.css';
import './authStyles.css';
import { useState } from 'react';

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
  <option key="Terminal Operator" value="Terminal Operator">Terminal Operator</option>,
  <option key="Trucking Operator" value="Trucking Operator">Trucking Operator</option>,
  <option key="Rail Operator" value="Rail Operator">Rail Operator</option>,
  <option key="Third Party Logistics Provider" value="Third Party Logistics Provider">Third Party Logistics Provider</option>,
  <option key="Vessel Agent" value="Vessel Agent">Vessel Agent</option>,
];

const orgOptions = [
	<option key="None" 									    value="None">None</option>,
	<option key="Union Pacific"							value="Union Pacific">Union Pacific</option>,
	<option key="CSX"									      value="CSX">CSX</option>,
	<option key="Heart of Georgia Railroad (HOG)" 		  value="Heart of Georgia Railroad (HOG)">Heart of Georgia Railroad (HOG)</option>,
	<option key="Illinois and Midland Railroad (IMRR)"	value="Illinois and Midland Railroad (IMRR)">Illinois and Midland Railroad (IMRR)</option>,
	<option key="ABC Drayage"						value="ABC Drayage">ABC Drayage</option>,
	<option key="XYZ 3PL"								value="XYZ 3PL">XYZ 3PL</option>,
	<option key="Leidos" 								value="Leidos">Leidos</option>

];

function Organization() {
  const [isPredefined, setIsPredefined] = useState(true);

  function toggle() {
    setIsPredefined((isPredefined) => !isPredefined);
  }

  return (
    <>
    {isPredefined &&<SelectField className="amplify-field" label="Your Organization" name="custom:organization" required>
                  {orgOptions}
                </SelectField>}
      <Button onClick={toggle}>{(isPredefined && 'Enter Organization if not listed') || (!isPredefined && 'Pick Organization from the list')}</Button>
      {!isPredefined && <TextField className="amplify-field" label="Your Organization" name="custom:organization" required>

                </TextField>}
      
    </>
  );
}

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

                
                <Organization />
                
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