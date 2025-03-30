import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "../../constants/endpoint";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#202124",
    color: "#fff",
    padding: "2rem",
  },
  form: {
    maxWidth: "600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    marginBottom: "2rem",
  },
  select: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #3c4043",
    backgroundColor: "#3c4043",
    color: "#fff",
    fontSize: "16px",
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
  error: {
    color: "#ea4335",
    padding: "0.5rem",
  },
};

const AssignTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, classesResponse] = await Promise.all([
          authenticatedFetch(`${ENDPOINTS.users.list}?role=TEACHER`),
          authenticatedFetch(ENDPOINTS.classes.list),
        ]);

        const teachersData = await teachersResponse.json();
        const classesData = await classesResponse.json();
        console.log({ teachersData, classesData });

        setTeachers(teachersData);
        setClasses(classesData);
      } catch (error) {
        console.log("Failed to load data:", error);

        setError("Failed to load data");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authenticatedFetch(`${ENDPOINTS.classes.update}/${selectedClass}`, {
        method: "PUT",
        body: JSON.stringify({ teacherId: selectedTeacher }),
      });
      navigate("/classes");
    } catch (error) {
      console.log("Failed to assign teacher:", error);
      setError("Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div style={styles.container}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h1 style={styles.title}>Assign Teacher to Class</h1>

          {error && <div style={styles.error}>{error}</div>}

          <select
            style={styles.select}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
          >
            <option value="">Select Class</option>
            {classes.map((classItem) => (
              <option key={classItem.classId} value={classItem.classId}>
                {classItem.className}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            required
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.username} value={teacher.username}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Assigning..." : "Assign Teacher"}
          </button>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

export default AssignTeacher;
