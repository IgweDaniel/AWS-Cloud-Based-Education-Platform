const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const {
  classesTableSchema,
  enrollmentsTableSchema,
  meetingsTableSchema,
} = require("../schema");

const dynamoDB = new DynamoDB({ region: "us-east-1" });

async function createTable(schema) {
  try {
    const result = await dynamoDB.createTable(schema);
    console.log(`Created table ${schema.TableName}:`, result);
    return result;
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`Table ${schema.TableName} already exists`);
    } else {
      console.error(`Error creating table ${schema.TableName}:`, error);
      throw error;
    }
  }
}

async function deployTables() {
  try {
    await Promise.all([
      createTable(classesTableSchema),
      createTable(enrollmentsTableSchema),
      createTable(meetingsTableSchema),
    ]);
    console.log("All tables deployed successfully");
  } catch (error) {
    console.error("Failed to deploy tables:", error);
    process.exit(1);
  }
}

deployTables();
