import AdminDashboardLayout from "../../components/AdminDashboardLayout";

import Profile from "@/components/Profile";

export const AdminProfilePage = () => {
  return (
    <AdminDashboardLayout title="Profile">
      <Profile />
    </AdminDashboardLayout>
  );
};

export default AdminProfilePage;
