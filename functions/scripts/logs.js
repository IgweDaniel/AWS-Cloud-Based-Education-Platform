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

const functionName = process.argv[2];
if (!functionName){
    console.error('Please provide a function name');
    process.exit(1);
}
execSync(`sls logs -f ${functionName} -t ${paramsString}`, { stdio: 'inherit' });