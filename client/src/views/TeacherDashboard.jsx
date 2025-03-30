import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { authenticatedFetch } from "../utils/fetch";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "@/constants";

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
  classInfo: {
    color: "#e8eaed",
  },
  button: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#7aa3e7",
    },
  },
};

export const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authenticatedFetch(ENDPOINTS.classes.list);
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
      <DashboardLayout title="Teacher Dashboard">Loading...</DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div style={styles.classGrid}>
        {classes.map((classItem) => (
          <div key={classItem.classId} style={styles.classCard}>
            <h3 style={styles.className}>{classItem.className}</h3>
            <div style={styles.classInfo}>
              <p>Students: {classItem.studentCount}</p>
              {classItem.activeMeeting && (
                <p style={{ color: "#34a853" }}>Class in Progress</p>
              )}
            </div>
            <button
              style={styles.button}
              onClick={() =>
                classItem.activeMeeting
                  ? navigate(
                      `/classes/${classItem.classId}/meeting/${classItem.activeMeeting}`
                    )
                  : navigate(`/classes/${classItem.classId}`)
              }
            >
              {classItem.activeMeeting ? "Join Class" : "View Class"}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
