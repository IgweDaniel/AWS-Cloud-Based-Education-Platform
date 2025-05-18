// Use the proxy in development, and the actual API URL in production
export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL ||
    "https://v0z6x8yxsl.execute-api.us-east-1.amazonaws.com/dev";

export const ENDPOINTS = {
  meetings: {
    create: `${API_BASE_URL}/create-meeting`,
    join: `${API_BASE_URL}/join-meeting`,
    delete: `${API_BASE_URL}/delete-meeting`,
  },
  courses: {
    list: `${API_BASE_URL}/courses`,
    create: `${API_BASE_URL}/courses`,
    details: (courseId) => `${API_BASE_URL}/courses/${courseId}`,
    enroll: (courseId) => `${API_BASE_URL}/courses/${courseId}/enroll`,
    removeStudent: (courseId) => `${API_BASE_URL}/courses/${courseId}/student`,
    update: (courseId) => `${API_BASE_URL}/courses/${courseId}/teacher`,
    metadata: `${API_BASE_URL}/courses/metadata`,
    resources: {
      list: (courseId) => `${API_BASE_URL}/courses/${courseId}/resources`,
      create: (courseId) => `${API_BASE_URL}/courses/${courseId}/resources`,
      delete: (courseId, resourceId) =>
        `${API_BASE_URL}/courses/${courseId}/resources/${resourceId}`,
      uploadUrl: `${API_BASE_URL}/resources/upload-url`,
    },
    teacher: {
      list: `${API_BASE_URL}/courses/teacher`,
      activeSessions: `${API_BASE_URL}/courses/teacher/active-sessions`,
      startSession: (courseId) =>
        `${API_BASE_URL}/courses/${courseId}/start-session`,
      endSession: (courseId) =>
        `${API_BASE_URL}/courses/${courseId}/end-session`,
      students: (courseId) => `${API_BASE_URL}/courses/${courseId}/students`,
    },
    join: (courseId) => `${API_BASE_URL}/courses/${courseId}/join`,
    endSession: (courseId) => `${API_BASE_URL}/courses/${courseId}/end-session`,
  },
  users: {
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    assignRole: `${API_BASE_URL}/users/role`,
  },
  academic: {
    terms: `${API_BASE_URL}/academic/terms`,
    departments: `${API_BASE_URL}/academic/departments`,
    currentTerm: `${API_BASE_URL}/academic/current-term`,
  },
  dashboard: {
    stats: `${API_BASE_URL}/dashboard/stats`,
  },
};
