import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { ROUTES } from "@/constants";

// eslint-disable-next-line react/prop-types
const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
