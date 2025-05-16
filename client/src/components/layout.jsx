import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

// UI Components
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import ProfileMenu from "./profile-menu";

// Icons
import {
  Menu,
  LogOut,
  GraduationCap,
  BarChart3,
  Clock,
  BookOpen,
  Users,
  PlusSquare,
  UserPlus,
  UserCheck,
  User,
  Video,
  Calendar,
  BookOpenCheck,
} from "lucide-react";

/**
 * Navigation link component used in sidebar
 */
const NavLink = ({ icon: Icon, label, href, onClick, badge, isActive }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start gap-2 pl-2 font-normal hover:bg-muted cursor-pointer relative"
      onClick={handleClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
      {badge && (
        <Badge
          variant="primary"
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          {badge}
        </Badge>
      )}
    </Button>
  );
};

/**
 * Get navigation items based on user role
 */
const getNavigationItems = (role, navigate, logoutFn) => {
  // Common navigation items for all users

  // Role-specific navigation items
  const roleSpecificItems = {
    SUPER_ADMIN: [
      {
        label: "Courses",
        icon: (props) => (
          <BookOpen className={cn("h-4 w-4", props.className)} />
        ),
        href: "/courses",
      },
      {
        label: "Faculty & Staff",
        icon: (props) => <Users className={cn("h-4 w-4", props.className)} />,
        href: "/users",
      },
      {
        label: "Create Course",
        icon: (props) => (
          <PlusSquare className={cn("h-4 w-4", props.className)} />
        ),
        href: "/create-course",
        badge: "New",
      },
      {
        label: "Add User",
        icon: (props) => (
          <UserPlus className={cn("h-4 w-4", props.className)} />
        ),
        href: "/create-user",
      },
      {
        label: "Assign Faculty",
        icon: (props) => (
          <UserCheck className={cn("h-4 w-4", props.className)} />
        ),
        href: "/assign-teacher",
      },
    ],
    TEACHER: [
      {
        label: "My Courses",
        icon: (props) => (
          <BookOpen className={cn("h-4 w-4", props.className)} />
        ),
        href: "/courses",
      },
      {
        label: "Sessions",
        icon: (props) => <Video className={cn("h-4 w-4", props.className)} />,
        href: "/sessions",
      },
      // {
      //   label: "Students",
      //   icon: (props) => <Users className={cn("h-4 w-4", props.className)} />,
      //   href: "/students",
      // },
    ],
    STUDENT: [
      {
        label: "My Courses",
        icon: (props) => (
          <BookOpen className={cn("h-4 w-4", props.className)} />
        ),
        href: "/courses",
      },
      // {
      //   label: "Schedule",
      //   icon: (props) => (
      //     <Calendar className={cn("h-4 w-4", props.className)} />
      //   ),
      //   href: "/schedule",
      // },
      // {
      //   label: "Grades",
      //   icon: (props) => (
      //     <BookOpenCheck className={cn("h-4 w-4", props.className)} />
      //   ),
      //   href: "/grades",
      // },
    ],
  };

  // Get items for current role
  const items = roleSpecificItems[role] || [];

  // Logout item that's always at the end
  const logoutItem = [
    {
      label: "Logout",
      icon: (props) => <LogOut className={cn("h-4 w-4", props.className)} />,
      onClick: async () => {
        try {
          if (logoutFn) {
            await logoutFn();
          }
        } catch (error) {
          console.error("Logout failed:", error);
        }
        navigate("/login");
      },
    },
  ];

  // Combine all items
  return [
    {
      label: "Dashboard",
      icon: (props) => <BarChart3 className={cn("h-4 w-4", props.className)} />,
      href: "/",
    },
    ...items,
    {
      label: "Profile",
      icon: (props) => <User className={cn("h-4 w-4", props.className)} />,
      href: "/profile",
    },
    ...logoutItem,
  ];
};

// Set the title dynamically based on the current path
const getTitle = (path, role) => {
  // Default dashboard titles based on role
  if (path === "/") {
    switch (role) {
      case "SUPER_ADMIN":
        return "Admin Dashboard";
      case "TEACHER":
        return "Faculty Dashboard";
      case "STUDENT":
        return "Student Dashboard";
      default:
        return "Dashboard";
    }
  }

  // Admin routes
  if (path.startsWith("/admin")) {
    if (path === "/admin") return "Admin Dashboard";
    if (path === "courses") return "Manage Courses";
    if (path === "users") return "Users Management";
    if (path === "create-user") return "Create User";
    if (path === "create-course") return "Create Course";
    if (path === "assign-lecturer") return "Assign Faculty";
    if (path.includes("/admin/class/") && path.endsWith("/students"))
      return "Manage Students";
    if (path === "/admin/profile") return "Admin Profile";
  }

  // Courses routes
  if (path === "/classes") return "My Courses";
  if (path.startsWith("/classes/") && path.includes("/meeting/"))
    return "Live Session";
  if (path.startsWith("/classes/") && path.endsWith("/start"))
    return "Start Session";
  if (path.startsWith("/classes/")) return "Course Details";

  // Other routes
  if (path === "/profile" || path === "/settings") return "User Profile";
  if (path.startsWith("/sessions")) return "Sessions";
  if (path.startsWith("/students")) return "Students";
  if (path.startsWith("/schedule")) return "Schedule";
  if (path.startsWith("/grades")) return "Grades";

  return "Dashboard"; // Fallback title
};

/**
 * Unified Dashboard Layout component
 * Renders dynamic sidebar based on user role and handles unified layout for all authenticated views
 */
const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [navItems, setNavItems] = useState([]);

  const path = location.pathname;

  useEffect(() => {
    if (user?.role) {
      setNavItems(getNavigationItems(user.role, navigate, logout));
    }
  }, [user?.role, navigate, logout]);

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Function to check if a nav item is active
  const isNavItemActive = (item) => {
    if (!item.href) return false;
    return (
      location.pathname === item.href ||
      location.pathname.startsWith(item.href + "/")
    );
  };

  // Get portal name based on role
  const getPortalName = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Admin Portal";
      case "TEACHER":
        return "Faculty Portal";
      case "STUDENT":
        return "Student Portal";
      default:
        return "Portal";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile navigation */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-10">
          <Button variant="outline" size="icon" className="bg-card shadow-md">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            <div className="p-6 border-b border-sidebar-border bg-sidebar">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-medium">CBEP University</h2>
                  <p className="text-xs opacity-80">
                    {getPortalName(user?.role)}
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
              {navItems.map((item, i) => (
                <NavLink
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  badge={item.badge}
                  isActive={isNavItemActive(item)}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-sidebar-border text-xs">
              <div className="flex items-center justify-between">
                <span>{currentDate}</span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> {currentTime}
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-medium">CBEP University</h2>
              <p className="text-xs opacity-80">{getPortalName(user?.role)}</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {navItems.map((item, i) => (
            <NavLink
              key={i}
              icon={item.icon}
              label={item.label}
              href={item.href}
              onClick={item.onClick}
              badge={item.badge}
              isActive={isNavItemActive(item)}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs">
          <div className="flex items-center justify-between">
            <span>{currentDate}</span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col text-foreground campus-hero">
        <header className="border-b border-border p-6 bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="container flex justify-between items-center">
            <h1 className="text-2xl font-semibold ml-10 md:ml-0">
              {getTitle(path, user?.role)}
            </h1>
            <div className="hidden md:flex items-center gap-4">
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} CBEP University. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

// PropTypes definitions
NavLink.propTypes = {
  icon: PropTypes.func,
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
  badge: PropTypes.string,
  isActive: PropTypes.bool,
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

export default Layout;
