import './styles/global.css';
import { useState, useEffect, useRef } from "react";
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Meet from './views/Meet';
import awsconfig from "./aws-exports";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { AuthProvider } from './context/auth';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';

Amplify.configure(awsconfig);


const App = () => {


  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/meet/:meetingId" element={
            <PrivateRoute>
              <Meet />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
      </AuthProvider>

  );
};

export default App;
