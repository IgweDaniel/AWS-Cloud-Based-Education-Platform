import "./index.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import awsconfig from "./aws-exports";
import { Amplify } from "aws-amplify";

import { AuthProvider } from "./context/auth";
import PrivateRoute from "./components/private-route";
import Login from "./views/login";

import Layout from "./components/layout";
import Dashboard from "@/views/dashboard";
import ProfilePage from "@/views/profile";

import Courses from "@/views/courses";
import CourseDetail from "@/views/course-detail";
import CreateUser from "@/views/admin/create-user";
import CreateCourse from "@/views/admin/create-course";
import AssignTeacher from "@/views/admin/assign-teacher";
import UsersList from "@/views/admin/users-list";
import ManageStudents from "@/views/admin/manage-students";
import StartSession from "@/views/start-session";
import SessionsList from "./views/sessions-list";
import { ROLES } from "./constants";
import Meet from "./views/meet";
import { Toaster } from "sonner";

Amplify.configure(awsconfig);

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/*" element={<PrivateRoute />}>
              <Route element={<Layout title={"shalom"} />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="courses" element={<Courses />} />

                <Route path="sessions" element={<SessionsList />} />
                <Route path="courses/:courseId" element={<CourseDetail />} />
                <Route
                  path="courses/:courseId/start"
                  element={<StartSession />}
                />
                <Route path="courses/:courseId/meeting" element={<Meet />} />

                {/* Catch-all route */}
                <Route
                  element={<PrivateRoute allowedRoles={[ROLES.TEACHER]} />}
                ></Route>
                <Route
                  element={
                    <PrivateRoute
                      allowedRoles={[ROLES.TEACHER, ROLES.SUPER_ADMIN]}
                    />
                  }
                ></Route>
                <Route
                  element={<PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}
                >
                  <Route path="users" element={<UsersList />} />
                  <Route path="create-user" element={<CreateUser />} />
                  <Route path="create-course" element={<CreateCourse />} />
                  <Route path="assign-teacher" element={<AssignTeacher />} />
                  <Route
                    path="courses/:courseId/manage-students"
                    element={<ManageStudents />}
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
};

export default App;
