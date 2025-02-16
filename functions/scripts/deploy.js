const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read the params file
const paramsFile = path.join(__dirname, '..', 'serverless.params.json');
const params = JSON.parse(fs.readFileSync(paramsFile, 'utf8'));

// Build the params string
const paramsString = Object.entries(params)
  .map(([key, value]) => `--param="${key}=${value}"`)
  .join(' ');

// Build the full command
const command = `serverless deploy ${paramsString}`;
console.log("paramsString",paramsString)
// return
try {
  console.log('Deploying with params:', params);
  execSync(command, { stdio: 'inherit' });
  console.log('Deployment completed successfully');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}