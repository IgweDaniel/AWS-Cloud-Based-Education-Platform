import {
  FiBook,
  FiUsers,
  FiPlus,
  FiUserPlus,
  FiUserCheck,
} from "react-icons/fi";
import DashboardLayout from "./DashboardLayout";
import { useNavigate } from "react-router-dom";

const AdminDashboardLayout = ({ children, additionalNavItems = [] }) => {
  const navigate = useNavigate();

  // Default admin navigation items
  const defaultNavItems = [
    {
      label: "Classes",
      icon: (props) => <FiBook size={20} {...props} />,
      onClick: () => navigate("/admin/classes"),
    },
    {
      label: "Users",
      icon: (props) => <FiUsers size={20} {...props} />,
      onClick: () => navigate("/admin/users"),
    },
    {
      label: "Create Class",
      icon: (props) => <FiPlus size={20} {...props} />,
      onClick: () => navigate("/admin/create-class"),
    },
    {
      label: "Add User",
      icon: (props) => <FiUserPlus size={20} {...props} />,
      onClick: () => navigate("/admin/create-user"),
    },
    {
      label: "Assign Teacher",
      icon: (props) => <FiUserCheck size={20} {...props} />,
      onClick: () => navigate("/admin/assign-teacher"),
    },
  ];

  // Combine default and additional nav items
  const navItems = [...defaultNavItems, ...additionalNavItems];

  return (
    <DashboardLayout title={"Admin Dashboard"} navItems={navItems}>
      {children}
    </DashboardLayout>
  );
};

export default AdminDashboardLayout;
