import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "../../constants";
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
  input: {
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
};

const CreateClass = () => {
  const [className, setClassName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authenticatedFetch(ENDPOINTS.classes.create, {
        method: "POST",
        body: JSON.stringify({ className, teacherId }),
      });
      navigate("/classes");
    } catch (error) {
      console.error("Failed to create class:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div style={styles.container}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h1>Create New Class</h1>
          <input
            style={styles.input}
            type="text"
            placeholder="Class Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Teacher ID"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Class"}
          </button>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

export default CreateClass;
