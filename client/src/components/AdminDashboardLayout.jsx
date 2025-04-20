import {
  BookOpen,
  Users,
  PlusSquare,
  UserPlus,
  UserCheck,
  User,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// eslint-disable-next-line react/prop-types
const AdminDashboardLayout = ({ children, defaultNavItems = [] }) => {
  const navigate = useNavigate();

  // Default admin navigation items
  const additionalNavItems = [
    {
      label: "Courses",
      // eslint-disable-next-line no-unused-vars
      icon: (props) => <BookOpen className="h-4 w-4" />,
      onClick: () => navigate("/admin/courses"),
    },
    {
      label: "Faculty & Staff",
      // eslint-disable-next-line no-unused-vars
      icon: (props) => <Users className="h-4 w-4" />,
      onClick: () => navigate("/admin/users"),
    },
    {
      label: "Create Course",
      // eslint-disable-next-line no-unused-vars
      icon: (props) => <PlusSquare className="h-4 w-4" />,
      onClick: () => navigate("/admin/create-course"),
      badge: "New",
    },
    {
      label: "Add User",
      // eslint-disable-next-line no-unused-vars
      icon: (props) => <UserPlus className="h-4 w-4" />,
      onClick: () => navigate("/admin/create-user"),
    },
    {
      label: "Assign Faculty",
      // eslint-disable-next-line no-unused-vars
      icon: (props) => <UserCheck className="h-4 w-4" />,
      onClick: () => navigate("/admin/assign-teacher"),
    },
    {
      label: "Profile",
      // eslint-disable-next-line react/prop-types
      icon: (props) => <User className={cn("h-4 w-4", props.className)} />,
      href: "/admin/profile",
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
