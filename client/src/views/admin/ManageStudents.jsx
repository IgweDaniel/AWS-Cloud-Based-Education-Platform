import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "../../constants/endpoint";

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
  section: {
    backgroundColor: "#3c4043",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
  },
  studentList: {
    display: "grid",
    gap: "1rem",
  },
  studentCard: {
    backgroundColor: "#4a4a4a",
    borderRadius: "8px",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8ab4f8",
    color: "#202124",
    fontWeight: "bold",
    cursor: "pointer",
  },
  removeButton: {
    backgroundColor: "#ea4335",
  },
  select: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #3c4043",
    backgroundColor: "#3c4043",
    color: "#fff",
    fontSize: "16px",
    width: "100%",
    marginBottom: "1rem",
  },
};

const ManageStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrolledResponse, availableResponse] = await Promise.all([
          authenticatedFetch(ENDPOINTS.classes.details(classId)),
          authenticatedFetch(`${ENDPOINTS.users.list}?role=STUDENT`),
        ]);

        const enrolledData = await enrolledResponse.json();
        const availableData = await availableResponse.json();

        setStudents(enrolledData.students || []);
        setAvailableStudents(
          availableData.filter(
            (student) => !enrolledData.students?.includes(student.username)
          )
        );
      } catch (error) {
        console.log("Failed to load students:", error);

        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleEnroll = async () => {
    try {
      await authenticatedFetch(ENDPOINTS.classes.enroll(classId), {
        method: "POST",
        body: JSON.stringify({ studentId: selectedStudent }),
      });
      // Refresh data
      // FIXME: why are we doing a had reload, we can do optimistic update
      // window.location.reload();
    } catch (error) {
      console.error("Failed to enroll student:", error);
      setError("Failed to enroll student");
    }
  };

  const handleRemove = async (studentId) => {
    try {
      await authenticatedFetch(ENDPOINTS.classes.removeStudent(classId), {
        method: "DELETE",
        body: JSON.stringify({ studentId }),
      });
      setStudents(students.filter((id) => id !== studentId));
    } catch (error) {
      console.error("Failed to remove student:", error);
      setError("Failed to remove student");
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Students</h1>
        <button
          style={styles.button}
          onClick={() => navigate(`/classes/${classId}`)}
        >
          Back to Class
        </button>
      </div>

      <div style={styles.section}>
        <h2>Add Student</h2>
        <select
          style={styles.select}
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">Select Student</option>
          {availableStudents.map((student) => (
            <option key={student.username} value={student.username}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>
        <button
          style={styles.button}
          onClick={handleEnroll}
          disabled={!selectedStudent}
        >
          Add Student
        </button>
      </div>

      <div style={styles.section}>
        <h2>Enrolled Students</h2>
        <div style={styles.studentList}>
          {students.map((studentId) => (
            <div key={studentId} style={styles.studentCard}>
              <div>{studentId}</div>
              <button
                style={{ ...styles.button, ...styles.removeButton }}
                onClick={() => handleRemove(studentId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;
