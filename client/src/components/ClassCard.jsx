/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/fetch";
import { useAuth } from "../context/auth";
import { ENDPOINTS } from "../constants";

const styles = {
  card: {
    backgroundColor: "#3c4043",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
    },
  },
  title: {
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
    color: "#8ab4f8",
  },
  info: {
    fontSize: "0.875rem",
    color: "#e8eaed",
    marginBottom: "1rem",
  },
  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  button: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#7aa3e7",
    },
  },
  dangerButton: {
    backgroundColor: "#ea4335",
    "&:hover": {
      backgroundColor: "#dc3626",
    },
  },
  activeMeeting: {
    backgroundColor: "#34a853",
    color: "#fff",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    display: "inline-block",
    marginBottom: "0.5rem",
  },
};

const ClassCard = ({ classItem, userRole }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startMeeting = async () => {
    try {
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ classId: classItem.classId }),
      });
      const data = await response.json();
      const newMeetingId = data.meeting.Meeting.MeetingId;
      navigate(`/classes/${classItem.classId}/meeting/${newMeetingId}`);
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  const joinMeeting = () => {
    navigate(
      `/classes/${classItem.classId}/meeting/${classItem.activeMeetingId}`
    );
  };
  console.log({ userRole });

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{classItem.className}</h3>

      <div style={styles.info}>
        <p>Teacher: {classItem.teacherName}</p>
        {classItem.studentCount && <p>Students: {classItem.studentCount}</p>}
      </div>

      {classItem.activeMeetingId && (
        <div style={styles.activeMeeting}>Live Class in Progress</div>
      )}

      <div style={styles.buttonContainer}>
        {userRole === "TEACHER" && classItem.teacherId === user?.userId && (
          <>
            <button
              onClick={startMeeting}
              style={styles.button}
              disabled={classItem.activeMeetingId}
            >
              {classItem.activeMeetingId ? "Class in Progress" : "Start Class"}
            </button>
            <button
              onClick={() => navigate(`/classes/${classItem.classId}/students`)}
              style={styles.button}
            >
              Manage Students
            </button>
          </>
        )}

        {userRole === "STUDENT" && classItem.activeMeetingId && (
          <button onClick={joinMeeting} style={styles.button}>
            Join Live Class
          </button>
        )}

        {userRole === "SUPER_ADMIN" && (
          <>
            <button
              onClick={() => navigate(`/admin/class/${classItem.classId}/edit`)}
              style={styles.button}
            >
              Edit Class
            </button>
            <button
              onClick={() =>
                navigate(`/admin/class/${classItem.classId}/students`)
              }
              style={styles.button}
            >
              Manage Students
            </button>
            <button
              onClick={() =>
                navigate(`/admin/class/${classItem.classId}/delete`)
              }
              style={{ ...styles.button, ...styles.dangerButton }}
            >
              Delete Class
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
