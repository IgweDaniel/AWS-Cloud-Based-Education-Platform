// Use the proxy in development, and the actual API URL in production
export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL ||
    "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev";

export const ENDPOINTS = {
  meetings: {
    create: `${API_BASE_URL}/create-meeting`,
    join: `${API_BASE_URL}/join-meeting`,
    delete: `${API_BASE_URL}/delete-meeting`,
  },
  classes: {
    list: `${API_BASE_URL}/courses`,
    create: `${API_BASE_URL}/courses`,
    details: (classId) => `${API_BASE_URL}/courses/${classId}`,
    enroll: (classId) => `${API_BASE_URL}/courses/${classId}/enroll`,
    removeStudent: (classId) => `${API_BASE_URL}/courses/${classId}/student`,
    update: (classId) => `${API_BASE_URL}/courses/${classId}`,
    metadata: `${API_BASE_URL}/courses/metadata`,
    teacher: {
      list: `${API_BASE_URL}/courses/teacher`,
      activeSessions: `${API_BASE_URL}/courses/teacher/active-sessions`,
      startSession: (classId) =>
        `${API_BASE_URL}/courses/${classId}/start-session`,
      endSession: (classId) => `${API_BASE_URL}/courses/${classId}/end-session`,
      students: (classId) => `${API_BASE_URL}/courses/${classId}/students`,
    },
    join: (classId) => `${API_BASE_URL}/courses/${classId}/join`,
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
};
