/* eslint-disable react/prop-types */
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { cn } from "@/lib/utils";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const NavLink = ({ icon: Icon, label, href, onClick }) => {
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
      className="w-full justify-start gap-2 pl-2 font-normal hover:bg-muted cursor-pointer"
      onClick={handleClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </Button>
  );
};

const DashboardLayout = ({ children, title, navItems }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Default logout nav item that's always present
  const defaultNavItems = [
    {
      label: "Logout",
      icon: (props) => <LogOut className={cn("h-4 w-4", props.className)} />,
      onClick: handleLogout,
    },
  ];

  // Combine provided nav items with default items
  const allNavItems = [...(navItems || []), ...defaultNavItems];

  return (
    <div className="flex min-h-screen   bg-[#202124] ">
      {/* Mobile navigation */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-10">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0  ">
          <div className="flex flex-col h-full bg-[#202124] text-white ">
            <div className="p-6 border-b">
              <Link to="/">
                <h2 className="text-lg font-medium">Dashboard</h2>
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-2 flex-1">
              {allNavItems.map((item, i) => (
                <NavLink
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onClick={item.onClick}
                />
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-[#202124] text-white ">
        <div className="p-6 border-b">
          <Link to="/">
            <h2 className="text-lg font-medium">Dashboard</h2>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {allNavItems.map((item, i) => (
            <NavLink
              key={i}
              icon={item.icon}
              label={item.label}
              href={item.href}
              onClick={item.onClick}
            />
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col  text-white">
        <header className="border-b p-6">
          <h1 className="text-2xl font-semibold ml-10 md:ml-0 ">{title}</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

// Import at the top of the file to avoid reference errors
import { LogOut } from "lucide-react";

export default DashboardLayout;
