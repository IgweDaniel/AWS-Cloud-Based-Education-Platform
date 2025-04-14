import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/fetch";
import { ENDPOINTS } from "../constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Clock,
  GraduationCap,
  Video,
  CalendarCheck,
} from "lucide-react";
import { ClipLoader } from "react-spinners";

const ClassCard = ({ classItem, userRole }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Define mock department & schedule data based on classItem
  const departmentMap = {
    "Introduction to Computer Science": "Computer Science",
    "Advanced Mathematics": "Mathematics",
    "Business Ethics": "Business",
    "Physics 101": "Sciences",
    "Modern Literature": "Liberal Arts",
    "Data Structures": "Computer Science",
    "Financial Accounting": "Business",
  };

  const scheduleMap = {
    "Introduction to Computer Science": "Mon/Wed/Fri 10:00-11:30 AM",
    "Advanced Mathematics": "Tue/Thu 1:00-2:30 PM",
    "Business Ethics": "Mon/Wed 3:00-4:30 PM",
    "Physics 101": "Mon/Wed/Fri 9:00-10:30 AM",
    "Modern Literature": "Tue/Thu 11:00-12:30 PM",
    "Data Structures": "Wed/Fri 2:00-3:30 PM",
    "Financial Accounting": "Tue/Thu 4:00-5:30 PM",
  };

  // Get department & schedule or use defaults
  const department = departmentMap[classItem.className] || "General Studies";
  const schedule = scheduleMap[classItem.className] || "Schedule TBD";

  // Create randomized enrollment numbers for display
  const totalStudents = Math.floor(Math.random() * 30) + 10;
  const progress = Math.floor(Math.random() * 100);

  const handleJoinMeeting = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        ENDPOINTS.classes.join(classItem.classId),
        {
          method: "GET",
        }
      );
      const data = await response.json();
      window.location.href = data.joinUrl;
    } catch (error) {
      console.error("Error joining class:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/classes/${classItem.classId}`);
  };

  // Generate a color seed based on the department name for consistent department coloring
  const getColorForDepartment = (dept) => {
    const colorMap = {
      "Computer Science": "bg-blue-100 text-blue-800",
      Mathematics: "bg-purple-100 text-purple-800",
      Business: "bg-amber-100 text-amber-800",
      Sciences: "bg-green-100 text-green-800",
      "Liberal Arts": "bg-rose-100 text-rose-800",
      Engineering: "bg-orange-100 text-orange-800",
      "Fine Arts": "bg-pink-100 text-pink-800",
      "Social Sciences": "bg-teal-100 text-teal-800",
    };

    return colorMap[dept] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow border-t-4"
      style={{ borderTopColor: "var(--primary)" }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle
            className="text-xl font-semibold line-clamp-2"
            title={classItem.className}
          >
            {classItem.className}
          </CardTitle>
          {classItem.activeMeeting && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              Live Now
            </Badge>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-1" />
          <Badge
            variant="outline"
            className={getColorForDepartment(department)}
          >
            {department}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {classItem.teacher?.name || "No instructor assigned"}
            </span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">{schedule}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {totalStudents} students enrolled
            </span>
          </div>

          {/* Course progress indicator */}
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span>Course Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t mt-2">
        {classItem.activeMeeting && (
          <Button
            onClick={handleJoinMeeting}
            className="w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <ClipLoader size={16} color="#ffffff" className="mr-2" />
            ) : (
              <Video className="h-4 w-4 mr-2" />
            )}
            Join Session
          </Button>
        )}

        {!classItem.activeMeeting && userRole === "TEACHER" && (
          <Button
            variant="outline"
            onClick={() => navigate(`/classes/${classItem.classId}/start`)}
            className="w-full"
          >
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}

        <Button
          variant={classItem.activeMeeting ? "outline" : "default"}
          onClick={handleViewDetails}
          className={classItem.activeMeeting ? "w-1/3" : "w-full"}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          {classItem.activeMeeting ? "Details" : "View Course"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
