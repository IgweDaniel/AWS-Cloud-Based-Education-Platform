import { FiBook, FiUsers } from "react-icons/fi";
import DashboardLayout from "../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "#3c4043",
    padding: "1.5rem",
    borderRadius: "8px",
    textAlign: "center",
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#8ab4f8",
    marginBottom: "0.5rem",
  },
  statLabel: {
    color: "#e8eaed",
  },
  section: {
    backgroundColor: "#3c4043",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    marginBottom: "1rem",
    color: "#8ab4f8",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  actionButton: {
    padding: "1rem",
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

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminDashboardLayout>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionGrid}>
          <button
            style={styles.actionButton}
            onClick={() => navigate("/admin/create-class")}
          >
            Create New Class
          </button>
          <button
            style={styles.actionButton}
            onClick={() => navigate("/admin/create-user")}
          >
            Add New User
          </button>
          <button
            style={styles.actionButton}
            onClick={() => navigate("/admin/assign-teacher")}
          >
            Assign Teacher
          </button>
          <button
            style={styles.actionButton}
            onClick={() => navigate("/admin/users")}
          >
            Manage Users
          </button>
        </div>
      </section>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
