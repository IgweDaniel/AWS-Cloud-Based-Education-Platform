const {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  GetMeetingCommand,
  DeleteMeetingCommand,
} = require("@aws-sdk/client-chime-sdk-meetings");

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const {
  S3Client,
  PutObjectCommand,
  // GetObjectCommand,
  DeleteObjectCommand,
  // HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { successResponse, errorResponse } = require("./utils/response");
const dynamoDbUtils = require("./utils/dynamo");

const region = "us-east-1";
const chimeClient = new ChimeSDKMeetingsClient({
  region,
});

// S3 bucket for course resources
const S3_BUCKET_NAME = "cbep-course-resources";
const s3Client = new S3Client({
  region,
  signatureVersion: "v4",
  s3ForcePathStyle: true,
});

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
    console.log({ env: process.env });
    const token = event.headers.Authorization?.replace("Bearer ", "");
    console.log({ token });
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

// This function would be located somewhere in your handler.js file

/**
 * Verify if a user has access to a course
 * @param {string} userId - The user ID
 * @param {string} userRole - The user role
 * @param {string} courseId - The course ID
 * @returns {Promise<void>}
 * @throws {Error} If the user doesn't have access
 */
async function verifyCourseAccess(userId, userRole, courseId) {
  // Super admins can access any course
  if (userRole === ROLES.SUPER_ADMIN) {
    return;
  }

  // Teachers can access courses they teach
  if (userRole === ROLES.TEACHER) {
    const course = await dynamoDbUtils.getCourseById(courseId);
    if (course && course.teacherId === userId) {
      return;
    }
  }

  // Students can access courses they're enrolled in
  if (userRole === ROLES.STUDENT) {
    const isEnrolled = await dynamoDbUtils.isStudentEnrolled(courseId, userId);
    if (isEnrolled) {
      return;
    }
  }

  // If we got here, user doesn't have access
  throw new Error("You don't have access to this course");
}

module.exports.updateCourseTeacher = async (event) => {
  try {
    const userData = await authenticate(event);

    // Verify SUPER_ADMIN role
    if (userData["custom:role"] !== ROLES.SUPER_ADMIN) {
      return errorResponse("Only SUPER_ADMIN can update course teachers", 403);
    }

    const { courseId } = event.pathParameters;
    const { teacherId } = JSON.parse(event.body);

    if (!courseId || !teacherId) {
      return errorResponse("Both courseId and teacherId are required", 400);
    }

    // Get teacher details from Cognito
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

    // Update the course in DynamoDB
    await dynamoDbUtils.updateCourse(
      courseId,
      "SET teacherId = :teacherId, teacherName = :teacherName",
      {
        ":teacherId": teacherId,
        ":teacherName": `${firstName} ${lastName}`,
      }
    );

    return successResponse({ message: "Course teacher updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.processEvent = async (event) => {
  console.log("Received Chime event:", JSON.stringify(event, null, 2));

  // Add your logic here (e.g., process meeting ended events)
  if (event.detail.eventType === "chime:MeetingEnded") {
    await dynamoDbUtils.deleteMeeting(event.detail.meetingId);

    console.log("Meeting ended:", event.detail.meetingId);
    return {
      meetingId: event.detail.meetingId,
      status: "deleted",
      reason: "auto-deleted by Chime",
    };
  }

  return { status: "success" };
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
    await verifyRole(event, [ROLES.SUPER_ADMIN]);
    const { courseName, teacherId } = JSON.parse(event.body);

    // Validate required fields
    if (!courseName) {
      return errorResponse("Course name is required", 400);
    }

    let courseData = {
      courseName: courseName,
      createdAt: new Date().toISOString(),
    };

    // Create a course without a teacher if teacherId is not provided
    if (!teacherId) {
      courseData.teacherId = "UNASSIGNED";
      courseData.teacherName = "Unassigned";

      const courseId = await dynamoDbUtils.createCourse(courseData);
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

    courseData.teacherId = teacherId;
    courseData.teacherName = `${firstName} ${lastName}`;

    const courseId = await dynamoDbUtils.createCourse(courseData);
    return successResponse({ courseId });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.deleteCourse = async (event) => {
  try {
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { courseId } = event.pathParameters;

    if (!courseId) {
      return errorResponse("Course ID is required", 400);
    }

    // Check if course exists
    const course = await dynamoDbUtils.getCourseById(courseId);
    if (!course) {
      return errorResponse("Course not found", 404);
    }

    // Delete the course and all related data
    await dynamoDbUtils.deleteCourse(courseId);

    return successResponse({
      message: "Course deleted successfully",
      courseId,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.enrollStudent = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

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

    if (!roleAttribute || roleAttribute.Value !== ROLES.STUDENT) {
      return errorResponse("User must have STUDENT role to be enrolled", 400);
    }

    // Enroll the student in the course
    await dynamoDbUtils.enrollStudent(courseId, studentId);

    return successResponse({
      id: studentId,
      username: studentId,
      email: studentUser.UserAttributes.find((attr) => attr.Name === "email")
        ?.Value,
      role: roleAttribute,
      firstName: studentUser.UserAttributes.find(
        (attr) => attr.Name === "given_name"
      )?.Value,
      lastName: studentUser.UserAttributes.find(
        (attr) => attr.Name === "family_name"
      )?.Value,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.unenrollStudent = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { studentId } = JSON.parse(event.body);
    const { courseId } = event.pathParameters;

    // Delete the enrollment record from the Enrollments table
    await dynamoDbUtils.unenrollStudent(courseId, studentId);

    return successResponse({ message: "Student unenrolled successfully" });
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
      case ROLES.SUPER_ADMIN:
        items = await dynamoDbUtils.getAllCourses();
        break;

      case ROLES.TEACHER:
        items = await dynamoDbUtils.getCoursesByTeacherId(userData.sub);
        break;

      case ROLES.STUDENT:
        items = await dynamoDbUtils.getStudentEnrolledCourses(userData.sub);
        break;
    }

    // Check for active meetings for each course
    items = await Promise.all(
      items.map(async (item) => {
        const meeting = await dynamoDbUtils.getLatestMeetingForCourse(
          item.courseId
        );
        const studentCount = await dynamoDbUtils.getCourseEnrollmentCount(
          item.courseId
        );

        return {
          courseId: item.courseId,
          courseName: item.courseName,
          createdAt: item.createdAt,
          teacherId: item.teacherId,
          teacherName: item.teacherName,
          activeMeetingId: meeting?.meetingId || null,
          studentCount: studentCount,
        };
      })
    );

    return successResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
};

// Add after getCourses endpoint
module.exports.getCourseDetails = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = event.pathParameters;

    // Get course details
    const courseData = await dynamoDbUtils.getCourseById(courseId);

    if (!courseData) {
      return errorResponse("Course not found", 404);
    }

    console.log({ courseData });

    const userRole = userData["custom:role"];
    // Check access
    await verifyCourseAccess(userData.sub, userRole, courseId);

    // Get student count and list
    const enrollments = await dynamoDbUtils.getCourseEnrollments(courseId);

    // Get active meeting if any
    const meeting = await dynamoDbUtils.getLatestMeetingForCourse(courseId);

    // Get detailed student information for each enrolled student
    const studentIds = enrollments.map((item) => item.userId);
    let enrolledStudents = [];

    // Only fetch student details if there are enrolled students
    if (studentIds.length > 0) {
      // Fetch each student individually using AdminGetUser - more efficient than loading all users
      const studentPromises = studentIds.map(async (studentId) => {
        try {
          const command = new AdminGetUserCommand({
            Username: studentId,
            UserPoolId: USER_POOL_ID,
          });

          const userResult = await cognito.send(command);

          return {
            id: studentId,
            username: studentId,
            email: userResult.UserAttributes.find(
              (attr) => attr.Name === "email"
            )?.Value,
            role: userResult.UserAttributes.find(
              (attr) => attr.Name === "custom:role"
            )?.Value,
            firstName: userResult.UserAttributes.find(
              (attr) => attr.Name === "given_name"
            )?.Value,
            lastName: userResult.UserAttributes.find(
              (attr) => attr.Name === "family_name"
            )?.Value,
          };
        } catch (error) {
          console.error(
            `Error fetching details for student ${studentId}:`,
            error
          );
          // Return basic info if user details can't be fetched
          return { id: studentId, username: studentId };
        }
      });

      enrolledStudents = await Promise.all(studentPromises);
    }

    const item = {
      courseId: courseData.courseId,
      courseName: courseData.courseName,
      createdAt: courseData.createdAt,
      teacherId: courseData.teacherId,
      teacherName: courseData.teacherName,
    };
    const response = {
      ...item,
      studentCount: enrollments.length,
      students: studentIds, // Keep the original students array for backwards compatibility
      enrolledStudents: enrolledStudents, // Add the new detailed student information
      activeMeetingId: meeting?.meetingId,
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

module.exports.deleteUser = async (event) => {
  try {
    // Verify super admin role
    await verifyRole(event, [ROLES.SUPER_ADMIN]);

    const { userId } = JSON.parse(event.body);

    // First get user details to check their role
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    });

    const userDetails = await cognito.send(getUserCommand);
    const userRole = userDetails.UserAttributes.find(
      (attr) => attr.Name === "custom:role"
    )?.Value;
    const userIdFromCognito = userDetails.UserAttributes.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    // Handle course cleanup based on user role
    if (userRole === ROLES.STUDENT) {
      // Get all courses the student is enrolled in
      const enrolledCourses = await dynamoDbUtils.getStudentEnrolledCourses(
        userIdFromCognito
      );

      // Remove student from all enrolled courses
      await Promise.all(
        enrolledCourses.map((course) =>
          dynamoDbUtils.unenrollStudent(course.courseId, userIdFromCognito)
        )
      );
    } else if (userRole === ROLES.TEACHER) {
      // Get all courses taught by this teacher
      const taughtCourses = await dynamoDbUtils.getCoursesByTeacherId(
        userIdFromCognito
      );

      // For each course, we need to either:
      // 1. Set teacherId to null/empty (if we want to keep the course without a teacher)
      // 2. Or delete the course entirely (if courses can't exist without teachers)
      // For this implementation, we'll set teacherId to null
      //  const promises=[]
      await Promise.all(
        taughtCourses.map((course) =>
          dynamoDbUtils.updateCourse(
            course.courseId,
            "SET teacherId = :teacherId, teacherName = :teacherName",
            {
              ":teacherId": "UNASSIGNED",
              ":teacherName": "Unassigned",
            }
          )
        )
      );
    } else if (userRole == ROLES.SUPER_ADMIN) {
      return errorResponse("Cannot delete a SUPER_ADMIN user", 403);
    }

    // Now delete the user from Cognito
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    });

    await cognito.send(deleteCommand);

    return successResponse({
      message: "User deleted successfully and removed from all courses",
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

    if (role && role?.toLowerCase() != "all") {
      formattedUsers = formattedUsers.filter((user) => user.role == role);
    }

    return successResponse(formattedUsers);
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.getMeetingStatus = async (event) => {
  try {
    const { meetingId } = event.pathParameters;

    // Check if meeting exists in DynamoDB
    const meetingData = await dynamoDbUtils.getMeetingById(meetingId);

    if (!meetingData) {
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
        courseId: meetingData.courseId,
        createdAt: meetingData.createdAt,
      });
    } catch (error) {
      if (error.name === "NotFoundException") {
        // Meeting was automatically deleted by Chime
        // Clean up our database
        await dynamoDbUtils.deleteMeeting(meetingId);

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

    // TODO: why is this in courseMetadata, shouln't it being in school metadata
    // Count active meetings
    const meetings = await dynamoDbUtils.getAllMeetings();

    return successResponse({
      currentTerm,
      terms: ACADEMIC_TERMS,
      departments: DEPARTMENTS,
      stats: {
        totalStudents: students,
        totalTeachers: teachers,
        activeCourses: meetings.length,
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

    const teacherCourses = await dynamoDbUtils.getCoursesByTeacherId(
      userData.sub
    );

    // Check for active meetings for each course
    const items = await Promise.all(
      teacherCourses.map(async (item) => {
        const meeting = await dynamoDbUtils.getLatestMeetingForCourse(
          item.courseId
        );
        const studentCount = await dynamoDbUtils.getCourseEnrollmentCount(
          item.courseId
        );

        return {
          courseId: item.courseId,
          courseName: item.courseName,
          createdAt: item.createdAt,
          teacherId: item.teacherId,
          teacherName: item.teacherName,
          activeMeetingId: meeting?.meetingId || null,
          studentCount: studentCount,
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
    const teacherCourses = await dynamoDbUtils.getCoursesByTeacherId(
      userData.sub
    );

    // Get active meetings for these courses
    const activeSessions = [];

    for (const courseItem of teacherCourses) {
      const meeting = await dynamoDbUtils.getLatestMeetingForCourse(
        courseItem.courseId
      );

      if (meeting) {
        activeSessions.push({
          courseId: courseItem.courseId,
          courseName: courseItem.courseName,
          meetingId: meeting.meetingId,
          startTime: meeting.createdAt,
        });
      }
    }

    return successResponse(activeSessions);
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
      const courseData = await dynamoDbUtils.getCourseById(courseId);

      if (!courseData || courseData.teacherId !== userData.sub) {
        return errorResponse(
          "You are not authorized to access this course",
          403
        );
      }
    }

    // Get students enrolled in this course
    const enrollments = await dynamoDbUtils.getCourseEnrollments(courseId);

    // Get detailed student info
    const studentDetails = [];

    for (const enrollment of enrollments) {
      const studentId = enrollment.userId;
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
          enrolledAt: enrollment.enrolledAt,
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

// TODO: bad reques handling
module.exports.createMeeting = async (event) => {
  try {
    const userData = await authenticate(event);
    const { courseId } = JSON.parse(event.body ?? "{}");
    if (!courseId) {
      return errorResponse("CourseId is required", 400);
    }

    // Verify user is the teacher of the course
    const courseData = await dynamoDbUtils.getCourseById(courseId);

    if (courseData?.teacherId !== userData.sub) {
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

    // Create attendee for the teacher
    const attendee = await createAttendee(
      meeting.Meeting.MeetingId,
      userData.sub
    );

    // Save the meeting in the database
    await dynamoDbUtils.saveMeeting(
      meeting.Meeting.MeetingId,
      courseId,
      userData.sub
    );

    return successResponse({ meeting, attendee });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.endTeacherSession = async (event) => {
  try {
    const userData = await verifyRole(event, [
      ROLES.TEACHER,
      ROLES.SUPER_ADMIN,
    ]);

    const { courseId } = event.pathParameters;

    // Check if teacher owns the course
    const courseData = await dynamoDbUtils.getCourseById(courseId);

    if (!courseData) {
      return errorResponse("Course not found", 404);
    }

    if (courseData.teacherId !== userData.sub) {
      return errorResponse(
        "You are not authorized to end a session for this course",
        403
      );
    }

    // Get active meeting for this course
    const latestMeeting = await dynamoDbUtils.getLatestMeetingForCourse(
      courseId
    );

    if (!latestMeeting) {
      return errorResponse("No active session found", 404);
    }

    const meetingId = latestMeeting.meetingId;

    // Delete meeting in Chime
    const deleteMeetingCommand = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(deleteMeetingCommand);

    // Delete from DynamoDB
    await dynamoDbUtils.deleteMeeting(meetingId);

    return successResponse({
      message: "Session ended successfully",
      meetingId,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

module.exports.joinMeeting = async (event) => {
  try {
    const { courseId } = event.pathParameters;
    const userData = await authenticate(event);

    if (!courseId) {
      return errorResponse("CourseId is required", 400);
    }
    // Get active meeting for this course
    const latestMeeting = await dynamoDbUtils.getLatestMeetingForCourse(
      courseId
    );

    if (!latestMeeting) {
      return errorResponse("No active session found", 404);
    }

    const meetingId = latestMeeting.meetingId;

    const userRole = userData["custom:role"];
    // Verify course access
    await verifyCourseAccess(userData.sub, userRole, courseId);

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

module.exports.getDashboardStats = async (event) => {
  try {
    // Authenticate the user
    const userData = await authenticate(event);

    // Verify that it's an admin
    if (userData["custom:role"] !== ROLES.SUPER_ADMIN) {
      return errorResponse(
        "Only administrators can access dashboard stats",
        403
      );
    }

    // Get courses count
    const courses = await dynamoDbUtils.getAllCourses();
    const totalCourses = courses.length;

    // Get active sessions count
    const activeSessions = await dynamoDbUtils.getActiveSessionsCount();

    // Get user counts by role using Cognito
    // TODO: paginate
    const listUsersCommand = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60, // Adjust as needed
    });

    const usersResponse = await cognito.send(listUsersCommand);

    // Count users by role
    let totalStudents = 0;
    let totalTeachers = 0;

    usersResponse.Users.forEach((user) => {
      const attributes = {};
      user.Attributes.forEach((attr) => {
        attributes[attr.Name] = attr.Value;
      });

      if (attributes["custom:role"] === ROLES.STUDENT) {
        totalStudents++;
      } else if (attributes["custom:role"] === ROLES.TEACHER) {
        totalTeachers++;
      }
    });

    return successResponse({
      totalCourses,
      totalStudents,
      totalTeachers,
      activeSessions,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return errorResponse(error);
  }
};

// FIXME: use one region,cognito on north chimes on east, move all to east
/**
 * Get all resources for a course
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
const getCourseResources = async (event) => {
  try {
    // Validate auth token
    const claims = await verifyToken(event);
    if (!claims) return errorResponse(401, "Unauthorized");

    // Get courseId from path parameters
    const { courseId } = event.pathParameters;
    if (!courseId) return errorResponse(400, "Missing course ID");

    // Get resources from DynamoDB
    const resources = await dynamoDbUtils.getCourseResources(courseId);

    return successResponse(resources);
  } catch (error) {
    console.error("Failed to get course resources:", error);
    return errorResponse(500, "Failed to get course resources");
  }
};

/**
 * Create a new resource for a course
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
const createCourseResource = async (event) => {
  try {
    // Validate auth token
    const claims = await verifyToken(event);
    if (!claims) return errorResponse(401, "Unauthorized");

    // Get courseId from path parameters
    const { courseId } = event.pathParameters;
    if (!courseId) return errorResponse(400, "Missing course ID");

    // Parse request body
    const resourceData = JSON.parse(event.body);

    // Validate required fields
    if (!resourceData.title || !resourceData.url) {
      return errorResponse(400, "Missing required fields: title, url");
    }

    // Add resource to DynamoDB
    const resource = await dynamoDbUtils.addCourseResource(courseId, {
      ...resourceData,
      createdBy: claims.sub,
    });

    return successResponse(resource);
  } catch (error) {
    console.error("Failed to create course resource:", error);
    return errorResponse(500, "Failed to create course resource");
  }
};

/**
 * Delete a resource
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
const deleteCourseResource = async (event) => {
  try {
    // Validate auth token
    const claims = await verifyToken(event);
    if (!claims) return errorResponse(401, "Unauthorized");

    // Get courseId and resourceId from path parameters
    const { courseId, resourceId } = event.pathParameters;
    if (!courseId || !resourceId) {
      return errorResponse(400, "Missing required path parameters");
    }

    // Get the resource to check if it has a file in S3
    const resource = await dynamoDbUtils.getResourceById(courseId, resourceId);

    if (resource && resource.fileKey) {
      // Delete file from S3
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: resource.fileKey,
          })
        );
      } catch (s3Error) {
        console.error("Failed to delete file from S3:", s3Error);
        // Continue anyway to delete the resource record
      }
    }

    // Delete resource from DynamoDB
    await dynamoDbUtils.deleteResource(courseId, resourceId);

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Failed to delete course resource:", error);
    return errorResponse(500, "Failed to delete course resource");
  }
};

/**
 * Generate a pre-signed URL for uploading a file to S3
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response with the upload URL
 */
const getResourceUploadUrl = async (event) => {
  try {
    // Validate auth token
    const claims = await verifyToken(event);
    if (!claims) return errorResponse(401, "Unauthorized");

    // Parse request body to get file metadata
    const { fileName, fileType, courseId } = JSON.parse(event.body);

    if (!fileName || !fileType || !courseId) {
      return errorResponse(
        400,
        "Missing required fields: fileName, fileType, courseId"
      );
    }

    // Create a unique file key
    const fileKey = `${courseId}/${Date.now()}-${fileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return successResponse({
      uploadUrl,
      fileKey,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return errorResponse(500, "Failed to generate upload URL");
  }
};

// Helper function to verify the JWT token
const verifyToken = async (event) => {
  try {
    const authHeader =
      event.headers.Authorization || event.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "");
    const claims = await verifier.verify(token);
    return claims;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

// Export the resource handlers
module.exports.getCourseResources = getCourseResources;
module.exports.createCourseResource = createCourseResource;
module.exports.deleteCourseResource = deleteCourseResource;
module.exports.getResourceUploadUrl = getResourceUploadUrl;
