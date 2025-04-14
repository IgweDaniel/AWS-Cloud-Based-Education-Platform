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
  AdminUpdateUserAttributesCommand,
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

// Academic terms - for filtering courses
const ACADEMIC_TERMS = [
  {
    id: "spring-2025",
    name: "Spring 2025",
    current: true,
    weekNumber: 7,
    totalWeeks: 15,
  },
  {
    id: "winter-2024",
    name: "Winter 2024",
    current: false,
    weekNumber: 0,
    totalWeeks: 12,
  },
  {
    id: "fall-2024",
    name: "Fall 2024",
    current: false,
    weekNumber: 0,
    totalWeeks: 15,
  },
  {
    id: "summer-2024",
    name: "Summer 2024",
    current: false,
    weekNumber: 0,
    totalWeeks: 8,
  },
];

// Academic departments
const DEPARTMENTS = [
  { id: "cs", name: "Computer Science" },
  { id: "math", name: "Mathematics" },
  { id: "eng", name: "Engineering" },
  { id: "sci", name: "Sciences" },
  { id: "hum", name: "Humanities" },
  { id: "bus", name: "Business" },
  { id: "arts", name: "Fine Arts" },
  { id: "soc", name: "Social Sciences" },
];

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

const verifyCourseAccess = async (userId, userRole, courseId) => {
  const enrollment = await dynamoDB.getItem({
    TableName: "Enrollments",
    Key: {
      courseId: { S: courseId },
      userId: { S: userId },
    },
  });

  if (!enrollment.Item) {
    const courseData = await dynamoDB.getItem({
      TableName: "Courses",
      Key: {
        courseId: { S: courseId },
      },
    });

    if (
      courseData.Item?.teacherId?.S !== userId &&
      userRole !== ROLES.SUPER_ADMIN
    ) {
      throw new Error("Not authorized to access this course");
    }
  }
};

// TODO: bad reques handling
module.exports.createMeeting = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = JSON.parse(event.body ?? "{}");
    if (!courseId) {
      return errorResponse("CourseId is required", 400);
    }

    // Verify user is the teacher of the course
    const courseData = await dynamoDB.getItem({
      TableName: "Courses",
      Key: {
        courseId: { S: courseId },
      },
    });

    if (courseData.Item?.teacherId?.S !== userData.sub) {
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
        courseId: { S: courseId },
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
    // Verify course access
    await verifyCourseAccess(userData.sub, userRole, meeting.Item.courseId.S);

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

module.exports.createCourse = async (event) => {
  try {
    const user = await verifyRole(event, ["SUPER_ADMIN"]);
    const { courseName, teacherId } = JSON.parse(event.body);

    // Validate required fields
    if (!courseName) {
      return errorResponse("Course name is required", 400);
    }

    // Create a course without a teacher if teacherId is not provided
    if (!teacherId) {
      const courseId = "course-" + Date.now();
      await dynamoDB.putItem({
        TableName: "Courses",
        Item: {
          courseId: { S: courseId },
          courseName: { S: courseName },
          teacherId: { S: "" },
          teacherName: { S: "Unassigned" },
          createdAt: { S: new Date().toISOString() },
        },
      });

      return successResponse({ courseId });
    }

    // If teacherId is provided, get teacher details from Cognito
    const command = new AdminGetUserCommand({
      Username: teacherId,
      UserPoolId: USER_POOL_ID,
    });
    const teacher = await cognito.send(command);

    const firstName =
      teacher.UserAttributes.find((attr) => attr.Name === "given_name")
        ?.Value || "";
    const lastName =
      teacher.UserAttributes.find((attr) => attr.Name === "family_name")
        ?.Value || "";

    const courseId = "course-" + Date.now();
    await dynamoDB.putItem({
      TableName: "Courses",
      Item: {
        courseId: { S: courseId },
        courseName: { S: courseName },
        teacherId: { S: teacherId },
        teacherName: { S: `${firstName} ${lastName}` },
        createdAt: { S: new Date().toISOString() },
      },
    });

    return successResponse({ courseId });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.enrollStudent = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, ["SUPER_ADMIN"]);

    const { studentId } = JSON.parse(event.body);
    const { courseId } = event.pathParameters;
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
        courseId: { S: courseId },
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
module.exports.getCourses = async (event) => {
  try {
    const userData = await authenticate(event);
    let items;
    console.log(userData["custom:role"]);

    switch (userData["custom:role"]) {
      case "SUPER_ADMIN":
        const allCourses = await dynamoDB.scan({
          TableName: "Courses",
        });
        items = allCourses.Items;
        break;

      case "TEACHER":
        const teacherCourses = await dynamoDB.query({
          TableName: "Courses",
          IndexName: "TeacherIndex",
          KeyConditionExpression: "teacherId = :teacherId",
          ExpressionAttributeValues: {
            ":teacherId": { S: userData.sub },
          },
        });
        items = teacherCourses.Items;
        break;

      case "STUDENT":
        const enrollments = await dynamoDB.scan({
          TableName: "Enrollments",
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": { S: userData.sub },
          },
        });

        // Get course details for each enrollment
        items = await Promise.all(
          enrollments.Items.map(async (enrollment) => {
            const courseData = await dynamoDB.getItem({
              TableName: "Courses",
              Key: {
                courseId: { S: enrollment.courseId.S },
              },
            });
            return courseData.Item;
          })
        );
        break;
    }

    // Check for active meetings for each course
    items = await Promise.all(
      items.map(async (item) => {
        const meetings = await dynamoDB.query({
          TableName: "Meetings",
          IndexName: "CourseIndex",
          KeyConditionExpression: "courseId = :courseId",
          ExpressionAttributeValues: {
            ":courseId": { S: item.courseId.S },
          },
          ScanIndexForward: false,
          Limit: 1,
        });

        // Need to count enrollments for each course
        const enrollments = await dynamoDB.query({
          TableName: "Enrollments",
          KeyConditionExpression: "courseId = :courseId",
          ExpressionAttributeValues: {
            ":courseId": { S: item.courseId.S },
          },
        });

        return {
          courseId: item.courseId.S,
          courseName: item.courseName.S,
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

// Add after getCourses endpoint

module.exports.getCourseDetails = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Get course details
    const courseData = await dynamoDB.getItem({
      TableName: "Courses",
      Key: {
        courseId: { S: courseId },
      },
    });

    if (!courseData.Item) {
      return errorResponse("Course not found", 404);
    }

    console.log({ courseData });

    const userRole = userData["custom:role"];
    // Check access
    await verifyCourseAccess(userData.sub, userRole, courseId);

    // Get student count and list
    const enrollments = await dynamoDB.query({
      TableName: "Enrollments",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
    });

    // Get active meeting if any
    const meetings = await dynamoDB.query({
      TableName: "Meetings",
      IndexName: "CourseIndex",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    const item = {
      courseId: courseData.Item.courseId.S,
      courseName: courseData.Item.courseName.S,
      createdAt: courseData.Item.createdAt.S,
      teacherId: courseData.Item.teacherId.S,
      teacherName: courseData.Item.teacherName.S,
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
        courseId: meetingData.Item.courseId.S,
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

// Add academic data endpoints
module.exports.getAcademicTerms = async (event) => {
  try {
    await authenticate(event);
    return successResponse(ACADEMIC_TERMS);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getCurrentTerm = async (event) => {
  try {
    await authenticate(event);
    const currentTerm =
      ACADEMIC_TERMS.find((term) => term.current) || ACADEMIC_TERMS[0];
    return successResponse(currentTerm);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getDepartments = async (event) => {
  try {
    await authenticate(event);
    return successResponse(DEPARTMENTS);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getCourseMetadata = async (event) => {
  try {
    await authenticate(event);

    // Get current term
    const currentTerm =
      ACADEMIC_TERMS.find((term) => term.current) || ACADEMIC_TERMS[0];

    // Count total students and teachers
    const usersCommand = new ListUsersCommand({ UserPoolId: USER_POOL_ID });
    const users = await cognito.send(usersCommand);

    const students = users.Users.filter((user) =>
      user.Attributes.some(
        (attr) => attr.Name === "custom:role" && attr.Value === ROLES.STUDENT
      )
    ).length;

    const teachers = users.Users.filter((user) =>
      user.Attributes.some(
        (attr) => attr.Name === "custom:role" && attr.Value === ROLES.TEACHER
      )
    ).length;

    // Count active meetings
    const meetings = await dynamoDB.scan({
      TableName: "Meetings",
    });

    return successResponse({
      currentTerm,
      terms: ACADEMIC_TERMS,
      departments: DEPARTMENTS,
      stats: {
        totalStudents: students,
        totalTeachers: teachers,
        activeCourses: meetings.Items.length,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};

// Teacher-specific endpoints
module.exports.getTeacherCourses = async (event) => {
  try {
    const userData = await authenticate(event);

    // Verify teacher role
    if (userData["custom:role"] !== ROLES.TEACHER) {
      return errorResponse("Only teachers can access this endpoint", 403);
    }

    const teacherCourses = await dynamoDB.query({
      TableName: "Courses",
      IndexName: "TeacherIndex",
      KeyConditionExpression: "teacherId = :teacherId",
      ExpressionAttributeValues: {
        ":teacherId": { S: userData.sub },
      },
    });

    // Check for active meetings for each course
    const items = await Promise.all(
      teacherCourses.Items.map(async (item) => {
        const meetings = await dynamoDB.query({
          TableName: "Meetings",
          IndexName: "CourseIndex",
          KeyConditionExpression: "courseId = :courseId",
          ExpressionAttributeValues: {
            ":courseId": { S: item.courseId.S },
          },
          ScanIndexForward: false,
          Limit: 1,
        });

        // Get student count for each course
        const enrollments = await dynamoDB.query({
          TableName: "Enrollments",
          KeyConditionExpression: "courseId = :courseId",
          ExpressionAttributeValues: {
            ":courseId": { S: item.courseId.S },
          },
        });

        return {
          courseId: item.courseId.S,
          courseName: item.courseName.S,
          createdAt: item.createdAt.S,
          teacherId: item.teacherId.S,
          teacherName: item.teacherName.S,
          activeMeeting: meetings.Items[0]?.meetingId.S || null,
          studentCount: enrollments.Items.length,
        };
      })
    );

    return successResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getTeacherActiveSessions = async (event) => {
  try {
    const userData = await authenticate(event);

    // Verify teacher role
    if (userData["custom:role"] !== ROLES.TEACHER) {
      return errorResponse("Only teachers can access this endpoint", 403);
    }

    // Get courses taught by this teacher
    const teacherCourses = await dynamoDB.query({
      TableName: "Courses",
      IndexName: "TeacherIndex",
      KeyConditionExpression: "teacherId = :teacherId",
      ExpressionAttributeValues: {
        ":teacherId": { S: userData.sub },
      },
    });

    // Get active meetings for these courses
    const activeSessions = [];

    for (const courseItem of teacherCourses.Items) {
      const meetings = await dynamoDB.query({
        TableName: "Meetings",
        IndexName: "CourseIndex",
        KeyConditionExpression: "courseId = :courseId",
        ExpressionAttributeValues: {
          ":courseId": { S: courseItem.courseId.S },
        },
        ScanIndexForward: false,
        Limit: 1,
      });

      if (meetings.Items.length > 0) {
        activeSessions.push({
          courseId: courseItem.courseId.S,
          courseName: courseItem.courseName.S,
          meetingId: meetings.Items[0].meetingId.S,
          startTime: meetings.Items[0].createdAt.S,
        });
      }
    }

    return successResponse(activeSessions);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.startTeacherSession = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Verify teacher role and course ownership
    if (userData["custom:role"] !== ROLES.TEACHER) {
      return errorResponse("Only teachers can start sessions", 403);
    }

    // Verify this teacher is assigned to the course
    const courseData = await dynamoDB.getItem({
      TableName: "Courses",
      Key: {
        courseId: { S: courseId },
      },
    });

    if (!courseData.Item) {
      return errorResponse("Course not found", 404);
    }

    if (courseData.Item.teacherId.S !== userData.sub) {
      return errorResponse(
        "You are not authorized to start a session for this course",
        403
      );
    }

    // Check if there's an existing active meeting
    const existingMeetings = await dynamoDB.query({
      TableName: "Meetings",
      IndexName: "CourseIndex",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    if (existingMeetings.Items.length > 0) {
      // Return the existing meeting
      return successResponse({
        meetingId: existingMeetings.Items[0].meetingId.S,
        message: "Session already in progress",
      });
    }

    // Create new meeting in Chime
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken: `course-${courseId}-${Date.now()}`,
      MediaRegion: region,
      ExternalMeetingId: `course-session-${courseId}-${Date.now()}`,
    });

    const meeting = await chimeClient.send(createMeetingCommand);

    // Store meeting in DynamoDB
    await dynamoDB.putItem({
      TableName: "Meetings",
      Item: {
        meetingId: { S: meeting.Meeting.MeetingId },
        courseId: { S: courseId },
        createdBy: { S: userData.sub },
        createdAt: { S: new Date().toISOString() },
      },
    });

    // Create attendee for the teacher
    const attendee = await createAttendee(
      meeting.Meeting.MeetingId,
      userData.sub
    );

    return successResponse({
      meetingId: meeting.Meeting.MeetingId,
      meeting,
      attendee,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.endTeacherSession = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Verify teacher role
    if (userData["custom:role"] !== ROLES.TEACHER) {
      return errorResponse("Only teachers can end sessions", 403);
    }

    // Check if teacher owns the course
    const courseData = await dynamoDB.getItem({
      TableName: "Courses",
      Key: {
        courseId: { S: courseId },
      },
    });

    if (!courseData.Item) {
      return errorResponse("Course not found", 404);
    }

    if (courseData.Item.teacherId.S !== userData.sub) {
      return errorResponse(
        "You are not authorized to end a session for this course",
        403
      );
    }

    // Get active meeting for this course
    const meetings = await dynamoDB.query({
      TableName: "Meetings",
      IndexName: "CourseIndex",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    if (meetings.Items.length === 0) {
      return errorResponse("No active session found", 404);
    }

    const meetingId = meetings.Items[0].meetingId.S;

    // Delete meeting in Chime
    const deleteMeetingCommand = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(deleteMeetingCommand);

    // Delete from DynamoDB
    await dynamoDB.deleteItem({
      TableName: "Meetings",
      Key: {
        meetingId: { S: meetingId },
      },
    });

    return successResponse({
      message: "Session ended successfully",
      meetingId,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getCourseStudents = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Verify teacher role or admin role
    if (
      userData["custom:role"] !== ROLES.TEACHER &&
      userData["custom:role"] !== ROLES.SUPER_ADMIN
    ) {
      return errorResponse("Insufficient permissions", 403);
    }

    // If teacher, verify they own the course
    if (userData["custom:role"] === ROLES.TEACHER) {
      const courseData = await dynamoDB.getItem({
        TableName: "Courses",
        Key: {
          courseId: { S: courseId },
        },
      });

      if (courseData.Item?.teacherId.S !== userData.sub) {
        return errorResponse(
          "You are not authorized to access this course",
          403
        );
      }
    }

    // Get students enrolled in this course
    const enrollments = await dynamoDB.query({
      TableName: "Enrollments",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
    });

    // Get detailed student info
    const studentDetails = [];

    for (const enrollment of enrollments.Items) {
      const studentId = enrollment.userId.S;
      try {
        const command = new AdminGetUserCommand({
          Username: studentId,
          UserPoolId: USER_POOL_ID,
        });

        const studentData = await cognito.send(command);

        studentDetails.push({
          id: studentId,
          email:
            studentData.UserAttributes.find((attr) => attr.Name === "email")
              ?.Value || "",
          firstName:
            studentData.UserAttributes.find(
              (attr) => attr.Name === "given_name"
            )?.Value || "",
          lastName:
            studentData.UserAttributes.find(
              (attr) => attr.Name === "family_name"
            )?.Value || "",
          enrolledAt: enrollment.enrolledAt.S,
        });
      } catch (error) {
        console.error(
          `Error fetching details for student ${studentId}:`,
          error
        );
        studentDetails.push({
          id: studentId,
          error: "Failed to fetch student details",
        });
      }
    }

    return successResponse(studentDetails);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.joinCourse = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Get active meeting for this course
    const meetings = await dynamoDB.query({
      TableName: "Meetings",
      IndexName: "CourseIndex",
      KeyConditionExpression: "courseId = :courseId",
      ExpressionAttributeValues: {
        ":courseId": { S: courseId },
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    if (meetings.Items.length === 0) {
      return errorResponse("No active session found", 404);
    }

    const meetingId = meetings.Items[0].meetingId.S;

    // Verify user has access to this course
    const userRole = userData["custom:role"];

    if (userRole === ROLES.STUDENT) {
      // Check if student is enrolled
      const enrollment = await dynamoDB.getItem({
        TableName: "Enrollments",
        Key: {
          courseId: { S: courseId },
          userId: { S: userData.sub },
        },
      });

      if (!enrollment.Item) {
        return errorResponse("You are not enrolled in this course", 403);
      }
    } else if (userRole === ROLES.TEACHER) {
      // Check if teacher owns the course
      const courseData = await dynamoDB.getItem({
        TableName: "Courses",
        Key: {
          courseId: { S: courseId },
        },
      });

      if (courseData.Item?.teacherId.S !== userData.sub) {
        return errorResponse("You are not the teacher of this course", 403);
      }
    } else if (userRole !== ROLES.SUPER_ADMIN) {
      return errorResponse("Insufficient permissions", 403);
    }

    // Get meeting from Chime
    const getMeetingCommand = new GetMeetingCommand({
      MeetingId: meetingId,
    });

    try {
      const meeting = await chimeClient.send(getMeetingCommand);

      // Create attendee
      const attendee = await createAttendee(meetingId, userData.sub);

      return successResponse({
        meeting: meeting.Meeting,
        attendee: attendee.Attendee,
        joinUrl: `${process.env.FRONTEND_URL}/courses/${courseId}/meeting/${meetingId}`,
      });
    } catch (error) {
      if (error.name === "NotFoundException") {
        // Meeting no longer exists in Chime, clean up our database
        await dynamoDB.deleteItem({
          TableName: "Meetings",
          Key: {
            meetingId: { S: meetingId },
          },
        });

        return errorResponse("Session has ended", 404);
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
};
