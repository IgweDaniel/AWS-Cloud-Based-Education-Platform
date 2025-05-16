import { useAuth } from "../context/auth";
import { Navigate } from "react-router-dom";
import AdminCoursesList from "../components/admin-courses-list";
import CourseList from "../components/courses-list";

const CoursesList = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case "SUPER_ADMIN":
      return <AdminCoursesList />;
    case "TEACHER":
    case "STUDENT":
      return <CourseList />;
    default:
      return <Navigate to="/login" />;
  }
};

export default CoursesList;
