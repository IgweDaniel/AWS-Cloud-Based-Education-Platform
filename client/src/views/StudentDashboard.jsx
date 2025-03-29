import { useState, useEffect } from "react";
import { authenticatedFetch } from "../utils/fetch";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "@/constants";
import { ClipLoader } from "react-spinners";
import DashboardLayout from "@/components/DashboardLayout";
// import { useAuth } from "../context/auth";
// import { getNavItems } from "../config/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock } from "lucide-react";

export const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const { user, logout } = useAuth();
  // const navItems = getNavItems(user, logout);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authenticatedFetch(ENDPOINTS.classes.list);
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="My Classes" navItems={[]}>
        <div className="flex justify-center items-center h-64">
          <ClipLoader size={36} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Classes" navItems={[]}>
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Classes Found</h3>
          <p className="text-muted-foreground">
            You are not enrolled in any classes yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.classId} className="overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {classItem.className}
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-bold">Teacher:</span>{" "}
                      {classItem.teacherName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-bold">Status:</span>{" "}
                      {classItem.activeMeeting
                        ? "Live Now"
                        : "No Active Session"}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 pb-4">
                <Button
                  className="w-full"
                  variant={classItem.activeMeeting ? "default" : "outline"}
                  onClick={() =>
                    classItem.activeMeeting &&
                    navigate(
                      `/classes/${classItem.classId}/meeting/${classItem.activeMeeting}`
                    )
                  }
                  disabled={!classItem.activeMeeting}
                >
                  {classItem.activeMeeting
                    ? "Join Live Class"
                    : "No Active Class"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
