/* eslint-disable react/prop-types */
import { FiHome, FiUsers, FiBook, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    minHeight: "100vh",
    backgroundColor: "#202124",
    color: "#fff",
  },
  sidebar: {
    backgroundColor: "#3c4043",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sidebarLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    color: "#fff",
    textDecoration: "none",
    transition: "background-color 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#4a4a4a",
    },
    "&.active": {
      backgroundColor: "#8ab4f8",
      color: "#202124",
    },
  },
  main: {
    padding: "2rem",
    overflowY: "auto",
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
};

const DashboardLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.sidebarLink} onClick={() => navigate("/dashboard")}>
          <FiHome size={20} />
          <span>Dashboard</span>
        </div>
        <div style={styles.sidebarLink} onClick={() => navigate("/classes")}>
          <FiBook size={20} />
          <span>Classes</span>
        </div>
        {user.role === "SUPER_ADMIN" && (
          <div
            style={styles.sidebarLink}
            onClick={() => navigate("/admin/users")}
          >
            <FiUsers size={20} />
            <span>Users</span>
          </div>
        )}
        <div style={styles.sidebarLink} onClick={handleLogout}>
          <FiLogOut size={20} />
          <span>Logout</span>
        </div>
      </nav>
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
