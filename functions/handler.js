const {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  GetMeetingCommand,
  ListMeetingsCommand,
  DeleteMeetingCommand,
} = require("@aws-sdk/client-chime-sdk-meetings");

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const {
  CognitoIdentityServiceProvider,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { successResponse, errorResponse } = require("./utils/response");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const region = "us-east-1";
const chimeClient = new ChimeSDKMeetingsClient({
  region,
});
const dynamoDB = new DynamoDB({ region });

const { USER_POOL_ID, CLIENT_ID: COGNITO_CLIENT_ID } = process.env;

// FIXME: use one region,cognito on north chimes on east, move all to east
const cognito = new CognitoIdentityProviderClient({
  region: "eu-north-1",
});
// const cognito = new CognitoIdentityServiceProvider({ region: "eu-north-1" });

const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "id",
  clientId: COGNITO_CLIENT_ID,
});
// const verifier = CognitoJwtVerifier.create({
//   userPoolId: USER_POOL_ID,
//   tokenUse: "access",
//   clientId: COGNITO_CLIENT_ID,
// });

function createAttendee(meetingId, externalUserId) {
  const command = new CreateAttendeeCommand({
    MeetingId: meetingId,
    ExternalUserId: externalUserId,
  });
  return chimeClient.send(command);
}

const authenticate = async (event) => {
  try {
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      throw new Error("No token provided");
    }
    return await verifier.verify(token);
  } catch (err) {
    console.error("Authentication error:", err);
    throw new Error("Invalid token");
  }
};

const verifyRole = async (event, requiredRoles) => {
  try {
    // Extract token from Authorization header

    const claims = await authenticate(event);

    // Check if user has required role
    // Assuming roles are stored in custom:role attribute
    const userRole = claims["custom:role"];
    console.log({ userRole, claims });

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new Error("Insufficient permissions");
    }

    return claims;
  } catch (error) {
    console.error("Authentication error:", error);
    error.statusCode = 401;
    throw error;
  }
};

const assignUserRole = async (username, role) => {
  try {
    // await cognito.adminUpdateUserAttributes({
    //   UserPoolId: USER_POOL_ID,
    //   Username: username,
    //   UserAttributes: [
    //     {
    //       Name: "custom:role",
    //       Value: role,
    //     },
    //   ],
    // });

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        {
          Name: "custom:role",
          Value: role,
        },
      ],
    });
    await cognito.send(command);
  } catch (error) {
    console.error("Error assigning role:", error);
    throw error;
  }
};

const verifyClassAccess = async (userId, userRole, classId) => {
  const enrollment = await dynamoDB.getItem({
    TableName: "Enrollments",
    Key: {
      classId: { S: classId },
      userId: { S: userId },
    },
  });

  if (!enrollment.Item) {
    const classData = await dynamoDB.getItem({
      TableName: "Classes",
      Key: {
        classId: { S: classId },
      },
    });

    if (
      classData.Item?.teacherId?.S !== userId &&
      userRole !== ROLES.SUPER_ADMIN
    ) {
      throw new Error("Not authorized to access this class");
    }
  }
};

// TODO: bad reques handling
module.exports.createMeeting = async (event) => {
  try {
    const userData = await authenticate(event);
    const { classId } = JSON.parse(event.body ?? "{}");
    if (!classId) {
      return errorResponse("ClassId is required", 400);
    }

    // Verify user is the teacher of the class
    const classData = await dynamoDB.getItem({
      TableName: "Classes",
      Key: {
        classId: { S: classId },
      },
    });

    if (classData.Item?.teacherId?.S !== userData.sub) {
      return errorResponse("Only teachers can create meetings", 403);
    }

    // Create meeting in Chime
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken:
        "unique-token-" + Math.random().toString(36).substring(7),
      MediaRegion: "us-east-1",
      ExternalMeetingId: "meeting-" + Math.random().toString(36).substring(7),
    });

    const meeting = await chimeClient.send(createMeetingCommand);

    // Store meeting in DynamoDB
    await dynamoDB.putItem({
      TableName: "Meetings",
      Item: {
        meetingId: { S: meeting.Meeting.MeetingId },
        classId: { S: classId },
        createdBy: { S: userData.sub },
        createdAt: { S: new Date().toISOString() },
      },
    });

    // Create attendee for the teacher
    const attendee = await createAttendee(
      meeting.Meeting.MeetingId,
      userData.sub
    );

    return successResponse({ meeting, attendee });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.joinMeeting = async (event) => {
  try {
    const userData = await authenticate(event);
    const { meetingId } = JSON.parse(event.body);

    // Get meeting details
    const meeting = await dynamoDB.getItem({
      TableName: "Meetings",
      Key: {
        meetingId: { S: meetingId },
      },
    });

    if (!meeting.Item) {
      return errorResponse("Meeting not found", 404);
    }

    const userRole = userData["custom:role"];
    // Verify class access
    await verifyClassAccess(userData.sub, userRole, meeting.Item.classId.S);

    // Get Chime meeting
    const getMeetingCommand = new GetMeetingCommand({
      MeetingId: meetingId,
    });

    const chimeMeeting = await chimeClient.send(getMeetingCommand);
    const attendee = await createAttendee(meetingId, userData.sub);

    return successResponse({ meeting: chimeMeeting, attendee });
  } catch (error) {
    if (error.name === "NotFoundException") {
      return errorResponse("Meeting not found", 404);
    }
    return errorResponse(error);
  }
};

module.exports.deleteMeeting = async (event) => {
  try {
    const { meetingId } = JSON.parse(event?.body ?? "{}");

    if (!meetingId) {
      return errorResponse("MeetingId is required", 400);
    }

    const deleteMeetingCommand = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(deleteMeetingCommand);

    return successResponse({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return errorResponse("Failed to delete meeting");
  }
};

module.exports.assignRole = async (event) => {
  try {
    // Verify that the requester is a SUPER_ADMIN
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { username, role } = JSON.parse(event.body);

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return errorResponse("Invalid role", 400);
    }

    await assignUserRole(username, role);

    return successResponse({ message: "Role assigned successfully" });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.createClass = async (event) => {
  try {
    const user = await verifyRole(event, ["SUPER_ADMIN"]);
    const { className, teacherId } = JSON.parse(event.body);

    // Get teacher details from Cognito
    const command = new AdminGetUserCommand({
      Username: teacherId,
      UserPoolId: USER_POOL_ID,
    });
    const teacher = await cognito.send(command);

    const firstName = teacher.UserAttributes.find(
      (attr) => attr.Name === "given_name"
    ).Value;
    const lastName = teacher.UserAttributes.find(
      (attr) => attr.Name === "family_name"
    ).Value;

    const classId = "class-" + Date.now();
    await dynamoDB.putItem({
      TableName: "Classes",
      Item: {
        classId: { S: classId },
        className: { S: className },
        teacherId: { S: teacherId },
        teacherName: { S: `${firstName} ${lastName}` },
        createdAt: { S: new Date().toISOString() },
      },
    });

    return successResponse({ classId });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.enrollStudent = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, ["SUPER_ADMIN"]);

    const { studentId } = JSON.parse(event.body);
    const { classId } = event.pathParameters;
    // Verify student role
    const command = new AdminGetUserCommand({
      Username: studentId,
      UserPoolId: USER_POOL_ID,
    });
    const studentUser = await cognito.send(command);

    console.log({ studentUser });

    const roleAttribute = studentUser.UserAttributes.find(
      (attr) => attr.Name === "custom:role"
    );
    console.log({ roleAttribute });

    if (!roleAttribute || roleAttribute.Value !== ROLES.STUDENT) {
      return errorResponse("User must have STUDENT role to be enrolled", 400);
    }

    await dynamoDB.putItem({
      TableName: "Enrollments",
      Item: {
        classId: { S: classId },
        userId: { S: studentId },
        enrolledAt: { S: new Date().toISOString() },
      },
    });

    return successResponse({ message: "Student enrolled successfully" });
  } catch (error) {
    return errorResponse(error);
  }
};

// Add these new endpoints
module.exports.getClasses = async (event) => {
  try {
    const userData = await authenticate(event);
    let items;
    console.log(userData["custom:role"]);

    switch (userData["custom:role"]) {
      case "SUPER_ADMIN":
        const allClasses = await dynamoDB.scan({
          TableName: "Classes",
        });
        items = allClasses.Items;
        break;

      case "TEACHER":
        const teacherClasses = await dynamoDB.query({
          TableName: "Classes",
          IndexName: "TeacherIndex",
          KeyConditionExpression: "teacherId = :teacherId",
          ExpressionAttributeValues: {
            ":teacherId": { S: userData.sub },
          },
        });
        items = teacherClasses.Items;
        break;

      case "STUDENT":
        const enrollments = await dynamoDB.scan({
          TableName: "Enrollments",
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": { S: userData.sub },
          },
        });

        // Get class details for each enrollment
        items = await Promise.all(
          enrollments.Items.map(async (enrollment) => {
            const classData = await dynamoDB.getItem({
              TableName: "Classes",
              Key: {
                classId: { S: enrollment.classId.S },
              },
            });
            return classData.Item;
          })
        );
        break;
    }

    // Check for active meetings for each class
    items = await Promise.all(
      items.map(async (item) => {
        const meetings = await dynamoDB.query({
          TableName: "Meetings",
          IndexName: "ClassIndex",
          KeyConditionExpression: "classId = :classId",
          ExpressionAttributeValues: {
            ":classId": { S: item.classId.S },
          },
          ScanIndexForward: false,
          Limit: 1,
        });

        // Need to count enrollments for each class
        const enrollments = await dynamoDB.query({
          TableName: "Enrollments",
          KeyConditionExpression: "classId = :classId",
          ExpressionAttributeValues: {
            ":classId": { S: item.classId.S },
          },
        });

        return {
          classId: item.classId.S,
          className: item.className.S,
          createdAt: item.createdAt.S,
          teacherId: item.teacherId.S,
          teacherName: item.teacherName.S,
          activeMeetingId: meetings.Items[0]?.meetingId.S || null,
          studentCount: enrollments.Items.length, // Add this line
        };
      })
    );

    return successResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
};

// admin fugu
// student john
// teache lith

// Add after getClasses endpoint

module.exports.getClassDetails = async (event) => {
  try {
    const userData = await authenticate(event);
    const { classId } = event.pathParameters;

    // Get class details
    const classData = await dynamoDB.getItem({
      TableName: "Classes",
      Key: {
        classId: { S: classId },
      },
    });

    if (!classData.Item) {
      return errorResponse("Class not found", 404);
    }

    console.log({ classData });

    const userRole = userData["custom:role"];
    // Check access
    await verifyClassAccess(userData.sub, userRole, classId);

    // Get student count and list
    const enrollments = await dynamoDB.query({
      TableName: "Enrollments",
      KeyConditionExpression: "classId = :classId",
      ExpressionAttributeValues: {
        ":classId": { S: classId },
      },
    });

    // Get active meeting if any
    const meetings = await dynamoDB.query({
      TableName: "Meetings",
      IndexName: "ClassIndex",
      KeyConditionExpression: "classId = :classId",
      ExpressionAttributeValues: {
        ":classId": { S: classId },
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    const item = {
      classId: classData.Item.classId.S,
      className: classData.Item.className.S,
      createdAt: classData.Item.createdAt.S,
      teacherId: classData.Item.teacherId.S,
      teacherName: classData.Item.teacherName.S,
    };
    const response = {
      ...item,
      studentCount: enrollments.Items.length,
      students: enrollments.Items.map((item) => item.userId.S),
      activeMeeting: meetings.Items[0]?.meetingId.S,
    };

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
};

// Add user management endpoints
module.exports.createUser = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { email, password, role, firstName, lastName } = JSON.parse(
      event.body
    );

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return errorResponse("Invalid role", 400);
    }

    // Create user in Cognito
    // const createUserResponse = await cognito.adminCreateUser({
    //   UserPoolId: USER_POOL_ID,
    //   Username: email,
    //   TemporaryPassword: password,
    //   UserAttributes: [
    //     { Name: "email", Value: email },
    //     { Name: "email_verified", Value: "true" },
    //     { Name: "custom:role", Value: role },
    //     { Name: "given_name", Value: firstName },
    //     { Name: "family_name", Value: lastName },
    //   ],
    //   MessageAction: "SUPPRESS", // Prevents sending automatic email
    // });

    // Set permanent password
    // await cognito.adminSetUserPassword({
    //   UserPoolId: USER_POOL_ID,
    //   Username: email,
    //   Password: password,
    //   Permanent: true,
    // });

    let command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:role", Value: role },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
      MessageAction: "SUPPRESS", // Prevents sending automatic email
    });
    const createUserResponse = await cognito.send(command);

    command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });

    await cognito.send(command);
    return successResponse({
      message: "User created successfully",
      userId: createUserResponse.User.Username,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.listUsers = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { role } = event.queryStringParameters || {};

    let params = {
      UserPoolId: USER_POOL_ID,
      // AttributesToGet: ["email", "custom:role", "given_name", "family_name"],
    };
    // params: { UserPoolId: 'eu-north-1_i3nTvPwwL', Filter: '"email"^="testuser"' }
    console.log({ params });

    // if (role) {
    //   // "Filter":
    //   // params.Filter = `\"custom:role\"^=\"${role}\"`;
    // }

    console.log({ params });

    const command = new ListUsersCommand(params);
    const users = await cognito.send(command);

    // const users = await cognito.listUsers(params);

    let formattedUsers = users.Users.map((user) => ({
      id: user.Attributes.find((attr) => attr.Name === "sub")?.Value,
      username: user.Username,
      email: user.Attributes.find((attr) => attr.Name === "email")?.Value,
      role: user.Attributes.find((attr) => attr.Name === "custom:role")?.Value,
      firstName: user.Attributes.find((attr) => attr.Name === "given_name")
        ?.Value,
      lastName: user.Attributes.find((attr) => attr.Name === "family_name")
        ?.Value,
    }));

    if (role && role?.toLowerCase() != "ALL") {
      formattedUsers = formattedUsers.filter((user) => user.role == role);
    }

    return successResponse(formattedUsers);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.checkMeetingStatus = async (event) => {
  try {
    console.log("Checking meeting statuses...");

    // Get all meetings from DynamoDB
    const meetingsData = await dynamoDB.scan({
      TableName: "Meetings",
    });

    const results = await Promise.all(
      meetingsData.Items.map(async (item) => {
        const meetingId = item.meetingId.S;
        try {
          // Check if meeting still exists in Chime
          const getMeetingCommand = new GetMeetingCommand({
            MeetingId: meetingId,
          });

          await chimeClient.send(getMeetingCommand);
          return { meetingId, status: "active" };
        } catch (error) {
          if (error.name === "NotFoundException") {
            // Meeting was automatically deleted by AWS Chime
            console.log(
              `Meeting ${meetingId} no longer exists in Chime, cleaning up DynamoDB`
            );

            // Delete from DynamoDB
            await dynamoDB.deleteItem({
              TableName: "Meetings",
              Key: {
                meetingId: { S: meetingId },
              },
            });

            return {
              meetingId,
              status: "deleted",
              reason: "auto-deleted by Chime",
            };
          }

          return { meetingId, status: "error", error: error.message };
        }
      })
    );

    return successResponse({
      message: "Meeting status check completed",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error checking meeting status:", error);
    return errorResponse("Failed to check meeting status");
  }
};

module.exports.getMeetingStatus = async (event) => {
  try {
    const { meetingId } = event.pathParameters;

    // Check if meeting exists in DynamoDB
    const meetingData = await dynamoDB.getItem({
      TableName: "Meetings",
      Key: {
        meetingId: { S: meetingId },
      },
    });

    if (!meetingData.Item) {
      return successResponse({
        active: false,
        reason: "Meeting not found in database",
      });
    }

    // Verify meeting exists in Chime
    try {
      const getMeetingCommand = new GetMeetingCommand({
        MeetingId: meetingId,
      });

      await chimeClient.send(getMeetingCommand);

      return successResponse({
        active: true,
        classId: meetingData.Item.classId.S,
        createdAt: meetingData.Item.createdAt.S,
      });
    } catch (error) {
      if (error.name === "NotFoundException") {
        // Meeting was automatically deleted by Chime
        // Clean up our database
        await dynamoDB.deleteItem({
          TableName: "Meetings",
          Key: {
            meetingId: { S: meetingId },
          },
        });

        return successResponse({
          active: false,
          reason: "Meeting was automatically deleted by Chime",
        });
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
};
