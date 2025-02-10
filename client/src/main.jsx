import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { ThemeProvider } from "styled-components";
import {
  MeetingProvider,
  lightTheme,
  GlobalStyles,
} from "amazon-chime-sdk-component-library-react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <MeetingProvider>
        <App />
      </MeetingProvider>
    </ThemeProvider>
  </StrictMode>
);
