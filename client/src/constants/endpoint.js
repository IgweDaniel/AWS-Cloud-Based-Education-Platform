export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// export const API_BASE_URL =
//   "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev";

export const ENDPOINTS = {
  meetings: {
    create: `${API_BASE_URL}/create-meeting`,
    join: `${API_BASE_URL}/join-meeting`,
    delete: `${API_BASE_URL}/delete-meeting`,
  },
  classes: {
    list: `${API_BASE_URL}/classes`,
    create: `${API_BASE_URL}/classes`,
    details: (classId) => `${API_BASE_URL}/classes/${classId}`,
    enroll: (classId) => `${API_BASE_URL}/classes/${classId}/enroll`,
  },
  users: {
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    assignRole: `${API_BASE_URL}/users/role`,
  },
};
