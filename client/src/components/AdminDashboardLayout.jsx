import {
  BookOpen,
  Users,
  PlusSquare,
  UserPlus,
  UserCheck,
  School,
  Settings,
  ClipboardList,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useNavigate } from "react-router-dom";

const AdminDashboardLayout = ({ children, additionalNavItems = [] }) => {
  const navigate = useNavigate();

  // Default admin navigation items
  const defaultNavItems = [
    {
      label: "Courses",
      icon: (props) => <BookOpen className="h-4 w-4" />,
      onClick: () => navigate("/admin/classes"),
    },
    {
      label: "Faculty & Staff",
      icon: (props) => <Users className="h-4 w-4" />,
      onClick: () => navigate("/admin/users"),
    },
    {
      label: "Create Course",
      icon: (props) => <PlusSquare className="h-4 w-4" />,
      onClick: () => navigate("/admin/create-class"),
      badge: "New",
    },
    {
      label: "Add User",
      icon: (props) => <UserPlus className="h-4 w-4" />,
      onClick: () => navigate("/admin/create-user"),
    },
    {
      label: "Assign Faculty",
      icon: (props) => <UserCheck className="h-4 w-4" />,
      onClick: () => navigate("/admin/assign-teacher"),
    },
    {
      label: "Academic Records",
      icon: (props) => <ClipboardList className="h-4 w-4" />,
      onClick: () => navigate("/admin/records"),
    },
    {
      label: "University Settings",
      icon: (props) => <Settings className="h-4 w-4" />,
      onClick: () => navigate("/admin/settings"),
    },
  ];

  // Combine default and additional nav items
  const navItems = [...defaultNavItems, ...additionalNavItems];

  return (
    <DashboardLayout title="University Administration" navItems={navItems}>
      {children}
    </DashboardLayout>
  );
};

export default AdminDashboardLayout;
