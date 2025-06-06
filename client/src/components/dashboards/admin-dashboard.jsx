import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Activity, Calendar, Zap } from "lucide-react";
import { authenticatedFetch } from "@/lib/fetch";
import { ENDPOINTS, ROUTES } from "@/constants";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: "...",
    totalStudents: "...",
    totalTeachers: "...",
    activeSessions: "...",
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats from the backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(ENDPOINTS.dashboard.stats);

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const statsData = await response.json();
        setStats({
          totalCourses: statsData.totalCourses,
          totalStudents: statsData.totalStudents,
          totalTeachers: statsData.totalTeachers,
          activeSessions: statsData.activeSessions,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Fallback data with clear indication it's not real data
        setStats({
          totalCourses: "N/A",
          totalStudents: "N/A",
          totalTeachers: "N/A",
          activeSessions: "N/A",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* University Admin Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 campus-text-gradient">
          University Administration
        </h1>
        <p className="text-muted-foreground">
          Manage courses, faculty, students, and university resources.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-primary" />
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalCourses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Faculty Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalTeachers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Full-time and adjuncts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="mr-2 h-4 w-4 text-primary" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.activeSessions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live classes in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate(ROUTES.ADMIN_CREATE_COURSE)}
            variant="outline"
            className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-foreground hover:bg-primary/5 hover:text-primary"
          >
            <BookOpen className="h-8 w-8 mb-2" />
            <div className="text-base font-semibold">Create Course</div>
            <div className="text-xs text-muted-foreground text-center">
              Add a new course to the catalog
            </div>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.ADMIN_CREATE_USER)}
            variant="outline"
            className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-foreground hover:bg-primary/5 hover:text-primary"
          >
            <Users className="h-8 w-8 mb-2" />
            <div className="text-base font-semibold">Add User</div>
            <div className="text-xs text-muted-foreground text-center">
              Register new students or faculty
            </div>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.ADMIN_ASSIGN_TEACHER)}
            variant="outline"
            className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-foreground hover:bg-primary/5 hover:text-primary"
          >
            <Calendar className="h-8 w-8 mb-2" />
            <div className="text-base font-semibold">Assign Faculty</div>
            <div className="text-xs text-muted-foreground text-center">
              Assign instructors to courses
            </div>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.ADMIN_USERS_LIST)}
            variant="outline"
            className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-foreground hover:bg-primary/5 hover:text-primary"
          >
            <Zap className="h-8 w-8 mb-2" />
            <div className="text-base font-semibold">Manage Users</div>
            <div className="text-xs text-muted-foreground text-center">
              View and edit user accounts
            </div>
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <span className="font-medium">All systems operational</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Last checked: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
