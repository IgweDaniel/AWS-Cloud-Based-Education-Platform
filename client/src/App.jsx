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
import Dashboard from "@/views/Dashboard";
import ProfilePage from "@/views/Profile";

import Courses from "@/views/Courses";
import CourseDetail from "@/views/CourseDetail";
import CreateUser from "@/views/admin/CreateUser";
import CreateCourse from "@/views/admin/CreateCourse";
import AssignTeacher from "@/views/admin/AssignTeacher";
import UsersList from "@/views/admin/UsersList";
// import ManageStudents from "@/views/admin/ManageStudents";
import StartSession from "@/views/StartSession";
import SessionsList from "./views/SessionsList";

Amplify.configure(awsconfig);

/**
 
 /login                 # Login page
/register             # Registration page
/dashboard            # Role-based dashboard
/classes              # List of classes
/classes/:id          # Class details
/classes/:id/meeting  # Live meeting
/settings             # User settings
/admin                # Admin controls
 */

const App = () => {
  return (
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
              {/* Catch-all route */}
              <Route element={<PrivateRoute allowedRoles={["TEACHER"]} />}>
                {/* <Route index element={<Dashboard />} /> */}
              </Route>
              <Route
                element={
                  <PrivateRoute allowedRoles={["TEACHER", "SUPER_ADMIN"]} />
                }
              ></Route>
              <Route element={<PrivateRoute allowedRoles={["SUPER_ADMIN"]} />}>
                <Route path="users" element={<UsersList />} />
                <Route path="create-user" element={<CreateUser />} />
                <Route path="create-course" element={<CreateCourse />} />
                <Route path="assign-teacher" element={<AssignTeacher />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
