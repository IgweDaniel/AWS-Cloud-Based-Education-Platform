import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { ROLES } from "../constants";
import AdminDashboard from "../components/dashboards/admin-dashboard";
import StudentDashboard from "../components/dashboards/student-dashboard";
import LecturerDashboard from "../components/dashboards/lecturer-dashboard";

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case ROLES.SUPER_ADMIN:
      return <AdminDashboard />;
    case ROLES.TEACHER:
      return <LecturerDashboard />;
    case ROLES.STUDENT:
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

export default Dashboard;
