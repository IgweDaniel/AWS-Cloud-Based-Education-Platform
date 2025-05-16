import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import AdminDashboard from "../components/dashboards/admin-dashboard";
import StudentDashboard from "../components/dashboards/student-dashboard";
import TeacherDashboard from "../components/dashboards/lecturer-dashboard";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
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

export default Dashboard;
