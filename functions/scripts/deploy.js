const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read the params file
const paramsFile = path.join(__dirname, "..", "serverless.params.json");
const params = JSON.parse(fs.readFileSync(paramsFile, "utf8"));

// Build the params string
const paramsString = Object.entries(params)
  .map(([key, value]) => `--param="${key}=${value}"`)
  .join(" ");

// Get function name from command line argument
const functionName = process.argv[2];

// Build the full command
const command = functionName
  ? `serverless deploy function -f ${functionName} ${paramsString}`
  : `serverless deploy ${paramsString}`;

try {
  console.log("Deploying with params:", params);
  console.log("Command:", command);
  execSync(command, { stdio: "inherit" });
  console.log("Deployment completed successfully");
} catch (error) {
  console.error("Deployment failed:", error.message);
  process.exit(1);
}
