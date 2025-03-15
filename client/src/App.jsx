import "./styles/global.css";
// import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./views/Home";
import Meet from "./views/Meet";
import awsconfig from "./aws-exports";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";

import { AuthProvider } from "./context/auth";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./components/Login";
import { DashboardRouter } from "./components/DashboardRouter";
import ClassList from "./views/ClassList";
import CreateUser from "./views/admin/CreateUser";
import CreateClass from "./views/admin/CreateClass";
import AssignTeacher from "./views/admin/AssignTeacher";
import ClassDetails from "./views/ClassDetails";
// import ManageStudents from "./views/admin/ManageStudents";
import UsersList from "./views/admin/UsersList";
import { AdminLayout } from "./layout/AdminLayout";
import AdminDashboard from "./views/AdminDashboard";
import ManageStudents from "./views/admin/ManageStudents";

Amplify.configure(awsconfig);

/**
 
 /login                 # Login page
/register             # Registration page
/dashboard            # Role-based dashboard
/classes              # List of classes
/classes/:id          # Class details
/classes/:id/meeting  # Live meeting
/profile              # User profile
/admin               # Admin controls
 */
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected base routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/meet/:meetingId" element={<Meet />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/classes" element={<ClassList />} />
            <Route path="/classes/:classId" element={<ClassDetails />} />
            <Route
              path="/classes/:classId/meeting/:meetingId"
              element={<Meet />}
            />
            {/* http://localhost:5173/admin/class/class-1741762643733/students */}
            <Route
              path="/admin/class/:classId/students"
              element={<ManageStudents />}
            />
            {/* Admin routes */}
            <Route
              element={
                <PrivateRoute allowedRoles={["SUPER_ADMIN"]}>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersList />} />
              <Route path="/admin/create-user" element={<CreateUser />} />
              <Route path="/admin/create-class" element={<CreateClass />} />
              <Route path="/admin/assign-teacher" element={<AssignTeacher />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
