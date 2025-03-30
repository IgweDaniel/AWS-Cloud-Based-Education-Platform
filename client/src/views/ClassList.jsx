import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import { authenticatedFetch } from "../utils/fetch";
import { useNavigate } from "react-router-dom";
import ClassCard from "../components/ClassCard";
import { ENDPOINTS } from "../constants";
import DashboardLayout from "../components/DashboardLayout";

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
  createButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#7aa3e7",
    },
  },
  list: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
    color: "#8ab4f8",
  },
  error: {
    textAlign: "center",
    padding: "2rem",
    color: "#ea4335",
  },
};

export const ClassList = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  console.log({ user });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);

        const response = await authenticatedFetch(ENDPOINTS.classes.list);

        const data = await response.json();
        console.log({ data });

        setClasses(data);
      } catch (err) {
        setError("Failed to load classes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  if (loading) {
    return <div style={styles.loading}>Loading classes...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <DashboardLayout title="Classes">
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Classes</h1>
          {user.role === "SUPER_ADMIN" && (
            <button
              onClick={() => navigate("/admin/create-class")}
              style={styles.createButton}
            >
              Create New Class
            </button>
          )}
        </div>

        <div style={styles.list}>
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.classId}
              classItem={classItem}
              userRole={user.role}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassList;
