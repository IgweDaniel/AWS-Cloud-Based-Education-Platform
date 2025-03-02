import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/fetch";
import { useAuth } from "../context/auth";
import { ENDPOINTS } from "../constants";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#202124",
    color: "#fff",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
  },
  infoCard: {
    backgroundColor: "#3c4043",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
  },
  label: {
    color: "#8ab4f8",
    marginBottom: "0.5rem",
  },
  value: {
    color: "#e8eaed",
  },
  button: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1rem",
    marginTop: "2rem",
  },
};

const ClassDetails = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await authenticatedFetch(
          ENDPOINTS.classes.details(classId)
        );
        const data = await response.json();
        setClassData(data);
      } catch (error) {
        console.error("Failed to load class details:", error);
        setError("Failed to load class details");
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{classData.className}</h1>
        {user.role === "TEACHER" && classData.teacherId === user.sub && (
          <button
            style={styles.button}
            onClick={() => navigate(`/classes/${classId}/students`)}
          >
            Manage Students
          </button>
        )}
      </div>

      <div style={styles.grid}>
        <div style={styles.infoCard}>
          <div style={styles.label}>Teacher</div>
          <div style={styles.value}>{classData.teacherName}</div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.label}>Students</div>
          <div style={styles.value}>{classData.studentCount} enrolled</div>
        </div>

        {classData.activeMeeting && (
          <div style={styles.infoCard}>
            <div style={styles.label}>Status</div>
            <div style={styles.value}>Live Class in Progress</div>
            <button
              style={{ ...styles.button, marginTop: "1rem" }}
              onClick={() =>
                navigate(
                  `/classes/${classId}/meeting/${classData.activeMeeting}`
                )
              }
            >
              Join Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
