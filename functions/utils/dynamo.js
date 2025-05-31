const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const region = "us-east-1";
const dynamoDB = new DynamoDB({ region });

/**
 * Get a course by its ID
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Object>} - The course data
 */
const getCourseById = async (courseId) => {
  const response = await dynamoDB.getItem({
    TableName: "Courses",
    Key: marshall({ courseId }),
  });

  return response.Item ? unmarshall(response.Item) : null;
};

/**
 * Get all courses (for admin)
 * @returns {Promise<Array>} - List of all courses
 */
const getAllCourses = async () => {
  const response = await dynamoDB.scan({
    TableName: "Courses",
  });

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Get courses taught by a specific teacher
 * @param {string} teacherId - The ID of the teacher
 * @returns {Promise<Array>} - List of courses taught by the teacher
 */
const getCoursesByTeacherId = async (teacherId) => {
  const response = await dynamoDB.query({
    TableName: "Courses",
    IndexName: "TeacherIndex",
    KeyConditionExpression: "teacherId = :teacherId",
    ExpressionAttributeValues: marshall({
      ":teacherId": teacherId,
    }),
  });

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Query courses by teacher using direct DynamoDB operation
 * @param {string} teacherId - The ID of the teacher
 * @returns {Promise<Array>} - List of courses
 */
const queryCoursesDirectly = async (teacherId) => {
  const response = await dynamoDB.query({
    TableName: "Courses",
    IndexName: "TeacherIndex",
    KeyConditionExpression: "teacherId = :teacherId",
    ExpressionAttributeValues: marshall({
      ":teacherId": teacherId,
    }),
  });

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Get courses enrolled by a specific student
 * @param {string} userId - The ID of the student
 * @returns {Promise<Array>} - List of courses the student is enrolled in
 */
const getStudentEnrolledCourses = async (userId) => {
  const enrollments = await dynamoDB.scan({
    TableName: "Enrollments",
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: marshall({
      ":userId": userId,
    }),
  });

  if (!enrollments.Items || enrollments.Items.length === 0) {
    return [];
  }

  // Get course details for each enrollment
  const courses = await Promise.all(
    enrollments.Items.map(async (enrollment) => {
      const unmarshalled = unmarshall(enrollment);
      const courseData = await getCourseById(unmarshalled.courseId);
      return courseData;
    })
  );

  return courses.filter(Boolean);
};

/**
 * Get the number of students enrolled in a course
 * @param {string} courseId - The ID of the course
 * @returns {Promise<number>} - The number of students enrolled
 */
const getCourseEnrollmentCount = async (courseId) => {
  const enrollments = await dynamoDB.query({
    TableName: "Enrollments",
    KeyConditionExpression: "courseId = :courseId",
    ExpressionAttributeValues: marshall({
      ":courseId": courseId,
    }),
  });

  return enrollments.Items ? enrollments.Items.length : 0;
};

/**
 * Get all student enrollments for a course
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Array>} - List of enrollments
 */
const getCourseEnrollments = async (courseId) => {
  const enrollments = await dynamoDB.query({
    TableName: "Enrollments",
    KeyConditionExpression: "courseId = :courseId",
    ExpressionAttributeValues: marshall({
      ":courseId": courseId,
    }),
  });

  return enrollments.Items
    ? enrollments.Items.map((item) => unmarshall(item))
    : [];
};

/**
 * Check if a student is enrolled in a course
 * @param {string} courseId - The ID of the course
 * @param {string} userId - The ID of the student
 * @returns {Promise<boolean>} - True if enrolled, false otherwise
 */
const isStudentEnrolled = async (courseId, userId) => {
  const enrollment = await dynamoDB.getItem({
    TableName: "Enrollments",
    Key: marshall({
      courseId,
      userId,
    }),
  });


  console.log({enrollment:unmarshall(enrollment.Item)});
  return !!enrollment.Item;
};

/**
 * Get the most recent meeting for a course
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Object|null>} - The meeting data or null if none found
 */
const getLatestMeetingForCourse = async (courseId) => {
  const meetings = await dynamoDB.query({
    TableName: "Meetings",
    KeyConditionExpression: "courseId = :courseId",
    ExpressionAttributeValues: marshall({
      ":courseId": courseId,
    }),
    ScanIndexForward: false,
    Limit: 1,
  });

  return meetings.Items && meetings.Items.length > 0
    ? unmarshall(meetings.Items[0])
    : null;
};

/**
 * Create or update a meeting for a course
 * @param {string} meetingId - The ID of the meeting
 * @param {string} courseId - The ID of the course
 * @param {string} createdBy - The ID of the user who created the meeting
 * @returns {Promise<void>}
 */
const saveMeeting = async (meetingId, courseId, createdBy) => {
  const existingMeeting = await getLatestMeetingForCourse(courseId);

  if (!existingMeeting) {
    // Create new meeting record
    await dynamoDB.putItem({
      TableName: "Meetings",
      Item: marshall({
        meetingId,
        courseId,
        createdBy,
        createdAt: new Date().toISOString(),
      }),
    });
  } else {
    // Update existing meeting record
    await dynamoDB.updateItem({
      TableName: "Meetings",
      Key: marshall({
        courseId,
        meetingId: existingMeeting.meetingId,
      }),
      UpdateExpression: "SET meetingId = :meetingId",
      ExpressionAttributeValues: marshall({
        ":meetingId": meetingId,
      }),
    });
  }
};

/**
 * Delete a meeting record
 * @param {string} meetingId - The ID of the meeting
 * @returns {Promise<void>}
 */
const deleteMeeting = async (meetingId) => {
  // First find the meeting to get its primary key
  const response = await dynamoDB.query({
    TableName: "Meetings",
    IndexName: "MeetingIdIndex",
    KeyConditionExpression: "meetingId = :meetingId",
    ExpressionAttributeValues: marshall({
      ":meetingId": meetingId,
    }),
  });

  if (response.Items && response.Items.length > 0) {
    const meeting = unmarshall(response.Items[0]);
    await dynamoDB.deleteItem({
      TableName: "Meetings",
      Key: marshall({
        courseId: meeting.courseId,
      }),
    });
  }
};

/**
 * Get meeting by ID
 * @param {string} meetingId - The ID of the meeting
 * @returns {Promise<Object|null>} - The meeting data or null if not found
 */
const getMeetingById = async (meetingId) => {
  // Query using the secondary index since meetingId might not be the partition key
  const response = await dynamoDB.query({
    TableName: "Meetings",
    IndexName: "MeetingIdIndex",
    KeyConditionExpression: "meetingId = :meetingId",
    ExpressionAttributeValues: marshall({
      ":meetingId": meetingId,
    }),
  });

  if (response.Items && response.Items.length > 0) {
    return unmarshall(response.Items[0]);
  }

  return null;
};

/**
 * Get meetings by meetingId using the secondary index
 * @param {string} meetingId - The ID of the meeting
 * @returns {Promise<Array>} - List of meetings
 */
const getMeetingsByMeetingId = async (meetingId) => {
  const response = await dynamoDB.query({
    TableName: "Meetings",
    IndexName: "MeetingIdIndex",
    KeyConditionExpression: "meetingId = :meetingId",
    ExpressionAttributeValues: marshall({
      ":meetingId": meetingId,
    }),
  });

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Query meetings for a specific course
 * @param {string} courseId - The ID of the course
 * @param {object} options - Additional query options
 * @param {boolean} options.scanIndexForward - Whether to scan in ascending order (default: true)
 * @param {number} options.limit - Maximum number of items to return
 * @returns {Promise<Array>} - List of meetings
 */
const queryMeetings = async (courseId, options = {}) => {
  const queryParams = {
    TableName: "Meetings",
    KeyConditionExpression: "courseId = :courseId",
    ExpressionAttributeValues: marshall({
      ":courseId": courseId,
    }),
  };

  if (options.scanIndexForward !== undefined) {
    queryParams.ScanIndexForward = options.scanIndexForward;
  }

  if (options.limit) {
    queryParams.Limit = options.limit;
  }

  const response = await dynamoDB.query(queryParams);

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Update a course
 * @param {string} courseId - The ID of the course
 * @param {string} updateExpression - The update expression (e.g., "SET title = :title")
 * @param {Object} expressionAttributeValues - The expression attribute values
 * @returns {Promise<void>}
 */
const updateCourse = async (
  courseId,
  updateExpression,
  expressionAttributeValues
) => {
  await dynamoDB.updateItem({
    TableName: "Courses",
    Key: marshall({ courseId }),
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: marshall(expressionAttributeValues),
  });
};

/**
 * Create a course
 * @param {Object} courseData - The course data
 * @returns {Promise<string>} - The ID of the created course
 */
const createCourse = async (courseData) => {
  const courseId = "course-" + Date.now();
  const item = {
    courseId,
    ...courseData,
  };

  await dynamoDB.putItem({
    TableName: "Courses",
    Item: marshall(item),
  });

  return courseId;
};

/**
 * Add student enrollment to a course
 * @param {string} courseId - The ID of the course
 * @param {string} userId - The ID of the student
 * @returns {Promise<void>}
 */
const enrollStudent = async (courseId, userId) => {
  await dynamoDB.putItem({
    TableName: "Enrollments",
    Item: marshall({
      courseId,
      userId,
      enrolledAt: new Date().toISOString(),
    }),
  });
};

/**
 * Remove student enrollment from a course
 * @param {string} courseId - The ID of the course
 * @param {string} userId - The ID of the student
 * @returns {Promise<void>}
 */
const unenrollStudent = async (courseId, userId) => {
  await dynamoDB.deleteItem({
    TableName: "Enrollments",
    Key: marshall({
      courseId,
      userId,
    }),
  });
};

/**
 * Get all meetings
 * @returns {Promise<Array>} - List of all meetings
 */
const getAllMeetings = async () => {
  const response = await dynamoDB.scan({
    TableName: "Meetings",
  });

  return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Get the count of active meetings/sessions
 * @returns {Promise<number>} - Number of active sessions
 */
const getActiveSessionsCount = async () => {
  const response = await dynamoDB.scan({
    TableName: "Meetings",
  });

  return response.Items ? response.Items.length : 0;
};

/**
 * Get an enrollment record
 * @param {string} courseId - The ID of the course
 * @param {string} userId - The ID of the student
 * @returns {Promise<Object|null>} - The enrollment data or null if not found
 */
const getEnrollment = async (courseId, userId) => {
  const response = await dynamoDB.getItem({
    TableName: "Enrollments",
    Key: marshall({
      courseId,
      userId,
    }),
  });

  return response.Item ? unmarshall(response.Item) : null;
};

/**
 * Get resources for a course
 * @param {string} courseId - The ID of the course
 * @returns {Promise<Array>} - List of resources for the course
 */
const getCourseResources = async (courseId) => {
  const resources = await dynamoDB.query({
    TableName: "Resources",
    KeyConditionExpression: "courseId = :courseId",
    ExpressionAttributeValues: marshall({
      ":courseId": courseId,
    }),
  });

  return resources.Items ? resources.Items.map((item) => unmarshall(item)) : [];
};

/**
 * Add a resource to a course
 * @param {string} courseId - The ID of the course
 * @param {Object} resource - The resource object to add
 * @returns {Promise<Object>} - The created resource
 */
const addCourseResource = async (courseId, resource) => {
  const resourceId = resource.resourceId || `res_${Date.now()}`;

  const resourceData = {
    courseId,
    resourceId,
    title: resource.title,
    description: resource.description || "",
    type: resource.type || "other",
    url: resource.url,
    fileKey: resource.fileKey, // S3 key if applicable
    size: resource.size || "0 KB",
    createdAt: new Date().toISOString(),
    createdBy: resource.createdBy,
  };

  // console.log({ resourceData });

  await dynamoDB.putItem({
    TableName: "Resources",
    Item: marshall(resourceData, {
      removeUndefinedValues: true, // Remove undefined values from the item
    }),
  });

  return resourceData;
};

/**
 * Get a resource by its ID
 * @param {string} courseId - The ID of the course
 * @param {string} resourceId - The ID of the resource
 * @returns {Promise<Object|null>} - The resource data or null if not found
 */
const getResourceById = async (courseId, resourceId) => {
  const response = await dynamoDB.getItem({
    TableName: "Resources",
    Key: marshall({
      courseId,
      resourceId,
    }),
  });

  return response.Item ? unmarshall(response.Item) : null;
};

/**
 * Delete a resource
 * @param {string} courseId - The ID of the course
 * @param {string} resourceId - The ID of the resource
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const deleteResource = async (courseId, resourceId) => {
  await dynamoDB.deleteItem({
    TableName: "Resources",
    Key: marshall({
      courseId,
      resourceId,
    }),
  });

  return true;
};

module.exports = {
  getCourseById,
  getAllCourses,
  getCoursesByTeacherId,
  queryCoursesDirectly,
  getStudentEnrolledCourses,
  getCourseEnrollmentCount,
  getCourseEnrollments,
  isStudentEnrolled,
  getLatestMeetingForCourse,
  saveMeeting,
  deleteMeeting,
  getActiveSessionsCount,
  getMeetingById,
  getMeetingsByMeetingId,
  queryMeetings,
  updateCourse,
  createCourse,
  enrollStudent,
  unenrollStudent,
  getAllMeetings,
  //   getActiveSessionsCount,
  getEnrollment,
  getCourseResources,
  addCourseResource,
  getResourceById,
  deleteResource,
};
