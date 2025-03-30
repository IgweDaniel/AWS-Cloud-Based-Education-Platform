import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import CreateUser from "../views/admin/CreateUser";
import CreateClass from "../views/admin/CreateClass";
import AssignTeacher from "../views/admin/AssignTeacher";
import UsersList from "../views/admin/UsersList";
import AdminDashboard from "../views/AdminDashboard";

export const AdminRouter = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/create-user" element={<CreateUser />} />
        <Route path="/create-class" element={<CreateClass />} />
        <Route path="/assign-teacher" element={<AssignTeacher />} />
      </Routes>
    </DashboardLayout>
  );
};
