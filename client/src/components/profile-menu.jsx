import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown } from "lucide-react";

const ProfileMenu = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 hover:bg-primary/10"
        onClick={toggleMenu}
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
          {user?.firstName?.[0]}
        </div>
        <div className="text-sm hidden lg:block">
          <div className="font-medium">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-muted-foreground">
            {user?.role?.replace("_", " ").toLowerCase()}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border z-50">
          <div className="py-2">
            <button
              onClick={() => handleNavigate("/profile")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center"
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
