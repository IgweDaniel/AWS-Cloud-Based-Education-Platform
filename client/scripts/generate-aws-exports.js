// scripts/generate-aws-exports.js
import fs from 'fs';
import 'dotenv/config'

const awsExports = {
  aws_project_region: process.env.AWS_REGION,
  aws_cognito_identity_pool_id: process.env.COGNITO_IDENTITY_POOL_ID,
  aws_cognito_region: process.env.COGNITO_REGION,
  aws_user_pools_id: process.env.USER_POOLS_ID,
  aws_user_pools_web_client_id: process.env.USER_POOLS_CLIENT_ID,

  "oauth": {},
  "aws_cognito_username_attributes": [
      "EMAIL"
  ],
  "aws_cognito_social_providers": [],
  "aws_cognito_signup_attributes": [
      "EMAIL"
  ],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": [
      "SMS"
  ],
  "aws_cognito_password_protection_settings": {
      "passwordPolicyMinLength": 8,
      "passwordPolicyCharacters": []
  },
  "aws_cognito_verification_mechanisms": [
      "EMAIL"
  ]
  // Add other required properties
};

const fileContent = `/* eslint-disable */
// Generated file - do not edit
const awsmobile = ${JSON.stringify(awsExports, null, 2)};
export default awsmobile;`;

fs.writeFileSync('./src/aws-exports.js', fileContent);