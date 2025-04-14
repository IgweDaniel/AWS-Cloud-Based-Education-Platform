import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { authenticatedFetch } from "../utils/fetch";
import { ENDPOINTS } from "../constants";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import ClassCard from "../components/ClassCard";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Bell,
  ChevronRight,
  GraduationCap,
  BarChart,
  BookOpenCheck,
  CheckSquare,
  Users,
} from "lucide-react";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    completedAssignments: 0,
    upcomingDeadlines: 0,
  });

  // Mock data for a more complete dashboard
  const announcements = [
    {
      id: 1,
      title: "Spring Registration Opens Soon",
      date: "2025-04-15",
      course: "University Registrar",
      priority: "high",
    },
    {
      id: 2,
      title: "Campus Career Fair",
      date: "2025-04-22",
      course: "Career Services",
      priority: "medium",
    },
    {
      id: 3,
      title: "Library Extended Hours",
      date: "2025-04-10",
      course: "University Library",
      priority: "low",
    },
  ];

  const upcomingAssignments = [
    {
      id: 1,
      title: "Research Proposal",
      course: "Advanced Research Methods",
      dueDate: "2025-04-18",
      status: "pending",
    },
    {
      id: 2,
      title: "Midterm Project",
      course: "Data Analysis",
      dueDate: "2025-04-20",
      status: "in-progress",
    },
    {
      id: 3,
      title: "Case Study Analysis",
      course: "Business Strategy",
      dueDate: "2025-04-25",
      status: "pending",
    },
  ];

  const eventCalendar = [
    {
      id: 1,
      title: "Physics Live Lecture",
      time: "10:00 AM - 11:30 AM",
      date: "2025-04-15",
      type: "class",
    },
    {
      id: 2,
      title: "Study Group Meeting",
      time: "3:00 PM - 4:30 PM",
      date: "2025-04-15",
      type: "meeting",
    },
    {
      id: 3,
      title: "Office Hours: Prof. Johnson",
      time: "2:00 PM - 3:00 PM",
      date: "2025-04-16",
      type: "office-hours",
    },
  ];

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authenticatedFetch(ENDPOINTS.classes.list);
        const classesData = await response.json();
        setClasses(classesData);

        // Update stats based on fetched data
        setStats({
          totalClasses: classesData.length,
          activeClasses: classesData.filter((c) => c.activeMeeting).length,
          completedAssignments: Math.floor(Math.random() * 15) + 5, // Mock data
          upcomingDeadlines: upcomingAssignments.length,
        });
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="campus-gradient rounded-xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back, {user?.name || "Student"}!
              </h1>
              <p className="text-white/80 max-w-xl">
                Track your academic progress, upcoming assignments, and course
                schedule all in one place. Your semester is 60% complete.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                className="border-white/30 hover:bg-white/10 text-white"
                onClick={() => navigate("/classes")}
              >
                View All Courses <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 mr-2 text-white/70" />
                <span className="text-white/70 text-sm">My Courses</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalClasses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <GraduationCap className="h-5 w-5 mr-2 text-white/70" />
                <span className="text-white/70 text-sm">Active Sessions</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeClasses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckSquare className="h-5 w-5 mr-2 text-white/70" />
                <span className="text-white/70 text-sm">Completed</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedAssignments}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 mr-2 text-white/70" />
                <span className="text-white/70 text-sm">Upcoming</span>
              </div>
              <p className="text-2xl font-bold">{stats.upcomingDeadlines}</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrolled Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button
                variant="ghost"
                className="text-primary"
                onClick={() => navigate("/classes")}
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <ClipLoader size={30} color="#0f4c81" />
              </div>
            ) : classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 4).map((classItem) => (
                  <ClassCard
                    key={classItem.classId}
                    classItem={classItem}
                    userRole={user?.role}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No Courses Enrolled
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You are not enrolled in any courses yet.
                  </p>
                  <Button onClick={() => navigate("/classes")}>
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Assignments */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Upcoming Assignments</h2>
              <Card>
                <CardContent className="p-0">
                  {upcomingAssignments.length > 0 ? (
                    <div className="divide-y">
                      {upcomingAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start p-4"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-2 mr-3 ${getStatusColor(
                              assignment.status
                            )}`}
                          ></div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.course}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Due:{" "}
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString()}
                            </div>
                            <Badge
                              variant={
                                assignment.status === "in-progress"
                                  ? "outline"
                                  : "secondary"
                              }
                              className="mt-1"
                            >
                              {assignment.status === "in-progress"
                                ? "In Progress"
                                : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      No upcoming assignments
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Today's Schedule
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary"
                  >
                    Full Calendar
                  </Button>
                </div>
                <CardDescription>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventCalendar.length > 0 ? (
                  <div className="space-y-3">
                    {eventCalendar.map((event) => (
                      <div key={event.id} className="flex items-start">
                        <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center mr-4">
                          {event.type === "class" && (
                            <BookOpen className="h-5 w-5 text-primary" />
                          )}
                          {event.type === "meeting" && (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                          {event.type === "office-hours" && (
                            <BookOpenCheck className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    No events scheduled for today
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="border-l-4 pl-4 py-1"
                      style={{
                        borderLeftColor:
                          announcement.priority === "high"
                            ? "var(--destructive)"
                            : announcement.priority === "medium"
                            ? "var(--warning)"
                            : "var(--primary)",
                      }}
                    >
                      <h4 className="font-medium">{announcement.title}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {announcement.course}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Academic Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-primary" />
                  Semester Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Overall Completion</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Assignments Completed</span>
                    <span className="font-medium">15/25</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Current GPA</span>
                    <span className="font-medium">3.7</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Full Transcript
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
