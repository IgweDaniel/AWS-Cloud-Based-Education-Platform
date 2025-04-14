import "./index.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import awsconfig from "./aws-exports";
import { Amplify } from "aws-amplify";

import { AuthProvider } from "./context/auth";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./components/Login";

import HomeRouter from "./components/HomeRouter";

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

          <Route element={<PrivateRoute />}>
            <Route path="/*" element={<HomeRouter />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
