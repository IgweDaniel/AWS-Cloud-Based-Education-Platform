const classesTableSchema = {
  TableName: "Classes",
  KeySchema: [{ AttributeName: "classId", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "classId", AttributeType: "S" },
    { AttributeName: "teacherId", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "TeacherIndex",
      KeySchema: [{ AttributeName: "teacherId", KeyType: "HASH" }],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

const enrollmentsTableSchema = {
  TableName: "Enrollments",
  KeySchema: [
    { AttributeName: "classId", KeyType: "HASH" },
    { AttributeName: "userId", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "classId", AttributeType: "S" },
    { AttributeName: "userId", AttributeType: "S" },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

const meetingsTableSchema = {
  TableName: "Meetings",
  KeySchema: [{ AttributeName: "meetingId", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "meetingId", AttributeType: "S" },
    { AttributeName: "classId", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "ClassIndex",
      KeySchema: [{ AttributeName: "classId", KeyType: "HASH" }],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

module.exports = {
  classesTableSchema,
  enrollmentsTableSchema,
  meetingsTableSchema,
};
