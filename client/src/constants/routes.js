// Route definitions for the application
// This centralizes all routes in one place to avoid hardcoding paths

export const ROUTES = {
  // Auth routes
  LOGIN: "/login",
  REGISTER: "/register",

  // Common routes
  HOME: "/",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  ABOUT: "/",
  CONTACT: "/",
  TOUR: "/tour",

  // Course routes
  COURSES: "/courses",
  COURSE_DETAIL: "/courses/:courseId",
  START_SESSION: "/courses/:courseId/start-session",
  SESSIONS: "/sessions",
  MEET: "/courses/:courseId/meeting",
  MEET_STAGING: "/courses/:courseId/start",

  // Admin routes
  ADMIN_CREATE_COURSE: "/admin/create-course",
  ADMIN_CREATE_USER: "/create-user",
  ADMIN_EDIT_USER: "/users/:userId/edit",
  ADMIN_USERS_LIST: "/users",
  ADMIN_ASSIGN_TEACHER: "/assign-teacher",
  ADMIN_MANAGE_STUDENTS: "/courses/:courseId/manage-students",
};

// Helper functions to generate route paths with parameters
export function getRouteWithParams(route, params) {
  let path = route;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      console.log({ path });

      path = path.replace(`:${key}`, value);
    });
  }
  return path;
}

// Examples of how to use:
// getRouteWithParams(ROUTES.COURSE_DETAIL, { courseId: '123' }) => '/courses/123'
// getRouteWithParams(ROUTES.MEET, { classId: '123', meetingId: '456' }) => '/courses/123/meet/456'
