/* eslint-disable react/prop-types */
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { cn } from "@/lib/utils";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  BookOpen,
  Users,
  Bookmark,
  Calendar,
  GraduationCap,
  Bell,
  BarChart3,
  Settings,
  User,
  Clock,
} from "lucide-react";
import { Badge } from "./ui/badge";
import ProfileMenu from "./ProfileMenu";

const NavLink = ({ icon: Icon, label, href, onClick, badge }) => {
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
      variant="ghost"
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

const DashboardLayout = ({ children, title, navItems }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Default logout nav item that's always present
  const defaultNavItems = [
    {
      label: "Dashboard",
      icon: (props) => <BarChart3 className={cn("h-4 w-4", props.className)} />,
      href: "/",
    },
    {
      label: "Courses",
      icon: (props) => <BookOpen className={cn("h-4 w-4", props.className)} />,
      href: "/classes",
    },
    {
      label: "Profile",
      icon: (props) => <User className={cn("h-4 w-4", props.className)} />,
      href: "/settings",
    },
    {
      label: "Logout",
      icon: (props) => <LogOut className={cn("h-4 w-4", props.className)} />,
      onClick: async () => {
        await logout();
        navigate("/login");
      },
    },
  ];

  // Combine provided nav items with default items
  const allNavItems = [...(navItems || []), ...defaultNavItems];

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
                    {user?.role === "STUDENT"
                      ? "Student Portal"
                      : user?.role === "TEACHER"
                      ? "Faculty Portal"
                      : "Admin Portal"}
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
              {allNavItems.map((item, i) => (
                <NavLink
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  badge={item.badge}
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
              <p className="text-xs opacity-80">
                {user?.role === "STUDENT"
                  ? "Student Portal"
                  : user?.role === "TEACHER"
                  ? "Faculty Portal"
                  : "Admin Portal"}
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {allNavItems.map((item, i) => (
            <NavLink
              key={i}
              icon={item.icon}
              label={item.label}
              href={item.href}
              onClick={item.onClick}
              badge={item.badge}
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
            <h1 className="text-2xl font-semibold ml-10 md:ml-0">{title}</h1>
            <div className="hidden md:flex items-center gap-4">
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="container mx-auto">{children}</div>
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

export default DashboardLayout;
