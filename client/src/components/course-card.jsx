/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROLES, ROUTES } from "../constants";
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

// Define department & schedule data based on classItem
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

const ClassCard = ({ classItem, userRole }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Get department & schedule or use defaults
  const department = departmentMap[classItem.courseName] || "General Studies";
  const schedule = scheduleMap[classItem.courseName] || "Schedule TBD";

  const handleJoinMeeting = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        ENDPOINTS.courses.join(classItem.courseId),
        {
          method: "GET",
        }
      );
      const data = await response.json();
      console.log({ data });

      navigate(
        getRouteWithParams(ROUTES.MEET, {
          courseId: classItem.courseId,
        })
      );
    } catch (error) {
      console.error("Error joining class:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate(
      getRouteWithParams(ROUTES.COURSE_DETAIL, {
        courseId: classItem.courseId,
      })
    );
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
            title={classItem.courseName}
          >
            {classItem.courseName}
          </CardTitle>
          {classItem.activeMeetingId && (
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
              {classItem.teacherName || "No instructor assigned"}
            </span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">{schedule}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {classItem.studentCount || 0} students enrolled
            </span>
          </div>
        </div>
      </CardContent>

      {/* {JSON.stringify(classItem, null, 2)} */}
      <CardFooter className="flex gap-2 pt-4 border-t mt-2">
        {classItem.activeMeetingId && (
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

        {!classItem.activeMeetingId && userRole === ROLES.TEACHER && (
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                getRouteWithParams(ROUTES.MEET_STAGING, {
                  courseId: classItem.courseId,
                })
              )
            }
            className="w-full"
          >
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}

        <Button
          variant={classItem.activeMeetingId ? "outline" : "default"}
          onClick={handleViewDetails}
          className={classItem.activeMeetingId ? "w-1/3" : "w-full"}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          {classItem.activeMeetingId ? "Details" : "View Course"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
