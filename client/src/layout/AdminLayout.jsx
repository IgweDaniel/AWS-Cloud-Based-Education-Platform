import { Outlet } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export const AdminLayout = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};
