import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../utils/userId";
import { useAuth } from "../context/auth";
import { authenticatedFetch } from "../utils/fetch";
import { FiLogOut } from "react-icons/fi";
const createEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/create-meeting";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#202124",
    color: "#fff",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    marginBottom: "2rem",
    textAlign: "center",
  },
  joinControls: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1rem",
    width: "100%",
    maxWidth: "600px",
    padding: "0 1rem",
    "@media (minWidth: 768px)": {
      flexDirection: "row",
      alignItems: "center",
    },
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #3c4043",
    backgroundColor: "#3c4043",
    color: "#fff",
    fontSize: "16px",
    width: "100%",
    maxWidth: "100%",
    "@media (minWidth: 768px)": {
      maxWidth: "400px",
    },
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: "600px",
    padding: "0 1rem",
    "@media (minWidth: 768px)": {
      flexDirection: "row",
      justifyContent: "center",
    },
  },
  button: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
    width: "100%",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#7aa3e7",
    },
    "&:disabled": {
      backgroundColor: "#4a4a4a",
      cursor: "not-allowed",
    },
    "@media (minWidth: 768px)": {
      width: "auto",
      minWidth: "150px",
    },
  },
};

// Add this CSS to your index.css or a separate stylesheet
const globalStyles = `
  @media (max-width: 480px) {
    html {
      font-size: 14px;
    }
  }

  @media (max-width: 320px) {
    html {
      font-size: 12px;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
`;

const Home = () => {
  const [meetingID, setMeetingID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const startMeeting = async () => {
    try {
      setIsLoading(true);
      const userId = getUserId();
      const response = await authenticatedFetch(createEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      const newMeetingId = data.meeting.Meeting.MeetingId;
      navigate(`/meet/${newMeetingId}`);
    } catch (error) {
      console.error("Error starting meeting:", error);
      setIsLoading(false);
    }
  };

  const joinMeeting = () => {
    if (meetingID.trim()) {
      navigate(`/meet/${meetingID}`);
    }
  };

  console.log({ user });

  return (
    <div style={styles.container}>
      <div>
        <p>LoginId: {user?.signInDetails.loginId}</p>
        <p>Role: {user?.role}</p>
      </div>
      <button
        onClick={async () => {
          console.log("loggging out");

          await logout();
          navigate("/");
        }}
      >
        <FiLogOut />
      </button>
      <h1 style={styles.title}>Video Meeting</h1>
      <div style={styles.joinControls}>
        <input
          type="text"
          value={meetingID}
          placeholder="Enter Meeting ID"
          onChange={(e) => setMeetingID(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={joinMeeting}
          style={styles.button}
          disabled={!meetingID.trim()}
        >
          Join Meeting
        </button>
      </div>
      <div style={styles.buttonContainer}>
        <button
          onClick={startMeeting}
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Start New Meeting"}
        </button>
      </div>
    </div>
  );
};

export default Home;
