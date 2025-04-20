import { useAuth } from "../context/auth";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../views/AdminDashboard";
import TeacherDashboard from "../views/TeacherDashboard";
import StudentDashboard from "../views/StudentDashboard";
import ClassList from "../views/ClassList";
import ClassDetails from "../views/ClassDetails";
import CreateUser from "../views/admin/CreateUser";
import CreateClass from "../views/admin/CreateClass";
import AssignTeacher from "../views/admin/AssignTeacher";
import UsersList from "../views/admin/UsersList";
import ManageStudents from "../views/admin/ManageStudents";
import ProfilePage from "../views/Profile";

import Meet from "../views/Meet";
import AdminCoursesList from "../views/admin/AdminCoursesList";
import AdminProfilePage from "@/views/admin/AdminProfile";

export const HomeRouter = () => {
  const { user } = useAuth();

  // Shared routes available to all authenticated users
  const renderSharedRoutes = () => (
    <>
      <Route path="/settings" element={<ProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </>
  );

  // Routes only for super admins
  const renderAdminRoutes = () => (
    <>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/courses" element={<AdminCoursesList />} />
      <Route path="/admin/users" element={<UsersList />} />
      <Route path="/admin/create-user" element={<CreateUser />} />
      <Route path="/admin/create-course" element={<CreateClass />} />
      <Route path="/admin/assign-teacher" element={<AssignTeacher />} />
      <Route
        path="/admin/class/:classId/students"
        element={<ManageStudents />}
      />
      <Route path="/admin/profile" element={<AdminProfilePage />} />
    </>
  );

  // Routes for teachers
  const renderNonAdmin = () => (
    <>
      <Route path="/classes" element={<ClassList />} />
      <Route path="/classes/:classId" element={<ClassDetails />} />
      <Route path="/classes/:classId/meeting/:meetingId" element={<Meet />} />
    </>
  );

  return (
    <Routes>
      {/* Default route based on user role */}
      <Route
        path="/"
        element={
          user.role === "SUPER_ADMIN" ? (
            <AdminDashboard />
          ) : user.role === "TEACHER" ? (
            <TeacherDashboard />
          ) : user.role === "STUDENT" ? (
            <StudentDashboard />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Shared routes */}
      {renderSharedRoutes()}

      {/* Role-specific routes */}
      {user.role === "SUPER_ADMIN" ? renderAdminRoutes() : renderNonAdmin()}

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default HomeRouter;
