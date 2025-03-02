import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { authenticatedFetch } from "../utils/fetch";
import { useNavigate } from "react-router-dom";

const styles = {
  classGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1rem",
  },
  classCard: {
    backgroundColor: "#3c4043",
    borderRadius: "8px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  className: {
    fontSize: "1.25rem",
    color: "#8ab4f8",
  },
  teacherName: {
    color: "#e8eaed",
  },
  joinButton: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#34a853",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#2d9248",
    },
  },
  disabledButton: {
    backgroundColor: "#3c4043",
    cursor: "not-allowed",
    "&:hover": {
      backgroundColor: "#3c4043",
    },
  },
};

export const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authenticatedFetch("/api/classes");
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">Loading...</DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      <div style={styles.classGrid}>
        {classes.map((classItem) => (
          <div key={classItem.classId} style={styles.classCard}>
            <h3 style={styles.className}>{classItem.className}</h3>
            <p style={styles.teacherName}>Teacher: {classItem.teacherName}</p>
            <button
              style={{
                ...styles.joinButton,
                ...(classItem.activeMeeting ? {} : styles.disabledButton),
              }}
              onClick={() =>
                classItem.activeMeeting &&
                navigate(
                  `/classes/${classItem.classId}/meeting/${classItem.activeMeeting}`
                )
              }
              disabled={!classItem.activeMeeting}
            >
              {classItem.activeMeeting ? "Join Live Class" : "No Active Class"}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
