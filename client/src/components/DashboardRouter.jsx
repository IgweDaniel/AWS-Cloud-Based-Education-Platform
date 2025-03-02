import { useAuth } from "../context/auth";
import AdminDashboard from "../views/AdminDashboard";
import TeacherDashboard from "../views/TeacherDashboard";
import StudentDashboard from "../views/StudentDashboard";
import { Navigate } from "react-router-dom";

export const DashboardRouter = () => {
  const { user } = useAuth();
  console.log({ user });

  switch (user.role) {
    case "SUPER_ADMIN":
      return <AdminDashboard />;
    case "TEACHER":
      return <TeacherDashboard />;
    case "STUDENT":
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};
