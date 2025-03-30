import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "../../constants";
import DashboardLayout from "../../components/DashboardLayout";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

const styles = {
  container: {
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  filters: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  select: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #3c4043",
    backgroundColor: "#3c4043",
    color: "#fff",
    fontSize: "14px",
  },
  button: {
    padding: "8px 16px",
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
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 8px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    color: "#8ab4f8",
    fontWeight: "normal",
  },
  td: {
    padding: "12px",
    backgroundColor: "#3c4043",
    "&:firstChild": {
      borderTopLeftRadius: "8px",
      borderBottomLeftRadius: "8px",
    },
    "&:lastChild": {
      borderTopRightRadius: "8px",
      borderBottomRightRadius: "8px",
    },
  },
  roleChip: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "bold",
  },
};

const getRoleStyle = (role) => {
  switch (role) {
    case "SUPER_ADMIN":
      return { backgroundColor: "#ea4335", color: "#fff" };
    case "TEACHER":
      return { backgroundColor: "#34a853", color: "#fff" };
    case "STUDENT":
      return { backgroundColor: "#8ab4f8", color: "#202124" };
    default:
      return { backgroundColor: "#3c4043", color: "#fff" };
  }
};

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const endpoint = roleFilter
          ? `${ENDPOINTS.users.list}?role=${roleFilter}`
          : ENDPOINTS.users.list;

        const response = await authenticatedFetch(endpoint);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter]);

  if (loading)
    return (
      <AdminDashboardLayout title="Users">Loading...</AdminDashboardLayout>
    );
  if (error)
    return <AdminDashboardLayout title="Users">{error}</AdminDashboardLayout>;

  return (
    <AdminDashboardLayout title="Users">
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.filters}>
            <select
              style={styles.select}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
            </select>
          </div>
          <button
            style={styles.button}
            onClick={() => navigate("/admin/create-user")}
          >
            Add New User
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td style={styles.td}>{user.id}</td>
                <td style={styles.td}>
                  {user.firstName} {user.lastName}
                </td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.roleChip,
                      ...getRoleStyle(user.role),
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={{
                      ...styles.button,
                      backgroundColor: "#3c4043",
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                    onClick={() =>
                      navigate(`/admin/users/${user.username}/edit`)
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminDashboardLayout>
  );
};

export default UsersList;
