import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import { authenticatedFetch } from "../../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROUTES } from "../../constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import ClassCard from "../course-card";
import {
  BookOpen,
  ChevronRight,
  Users,
  Presentation,
  Video,
} from "lucide-react";

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachingStats, setTeachingStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeClasses: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch the teacher's classes
        // Run both fetches in parallel
        const [classesResponse, activeSessionsResponse] = await Promise.all([
          authenticatedFetch(ENDPOINTS.courses.teacher.list),
          authenticatedFetch(ENDPOINTS.courses.teacher.activeSessions),
        ]);

        const [classesData, activeSessionsData] = await Promise.all([
          classesResponse.json(),
          activeSessionsResponse.json(),
        ]);
        setClasses(classesData);
        setActiveSessions(activeSessionsData || []);

        // Calculate total students
        // Run student fetches in parallel for all classes
        const studentCounts = await Promise.all(
          classesData.map(async (classItem) => {
            const studentsResponse = await authenticatedFetch(
              ENDPOINTS.courses.teacher.students(classItem.courseId)
            );
            const studentsData = await studentsResponse.json();
            return studentsData?.length ?? 0;
          })
        );
        const totalStudents = studentCounts.reduce(
          (sum, count) => sum + count,
          0
        );

        setTeachingStats({
          totalCourses: classesData.length,
          totalStudents: totalStudents,
          activeClasses: activeSessionsData?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartSession = async (courseId) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        ENDPOINTS.courses.teacher.startSession(courseId),
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to start session");
      }
      // const data = await response.json();
      navigate(
        getRouteWithParams(ROUTES.MEET, {
          courseId: courseId,
        })
      );
    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="campus-gradient rounded-xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, Professor {user?.firstName || ""}!
            </h1>
            <p className="text-white/80 max-w-xl">
              Manage your courses and connect with your students through live
              video sessions.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              variant="outline"
              className="border-white/30 hover:bg-white/10 text-black cursor-pointer hover:text-white"
              onClick={() => navigate(ROUTES.COURSES)}
            >
              Manage All Courses <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BookOpen className="h-5 w-5 mr-2 text-white/70" />
              <span className="text-white/70 text-sm">Teaching</span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? "--" : teachingStats.totalCourses} courses
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 mr-2 text-white/70" />
              <span className="text-white/70 text-sm">Students</span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? "--" : teachingStats.totalStudents}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Presentation className="h-5 w-5 mr-2 text-white/70" />
              <span className="text-white/70 text-sm">Active</span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? "--" : teachingStats.activeClasses} sessions
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button
                variant="ghost"
                className="text-primary"
                onClick={() => navigate(ROUTES.COURSES)}
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
                    key={classItem.courseId}
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
                    No Courses Assigned
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You have not been assigned any courses to teach yet.
                  </p>
                  <Button onClick={() => navigate(ROUTES.COURSES)}>
                    View Available Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Sessions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
            <Card>
              <CardContent
                className={activeSessions.length === 0 ? "py-8" : "p-0"}
              >
                {activeSessions.length > 0 ? (
                  <div className="divide-y">
                    {activeSessions.map((session) => (
                      <div key={session.courseId} className="p-4">
                        <div className="flex flex-wrap items-center justify-between mb-2">
                          <h4 className="font-medium">{session.courseName}</h4>
                          <Badge variant="success" className="ml-auto">
                            Live Now
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Session started at{" "}
                          {new Date(session.startTime).toLocaleTimeString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              navigate(
                                getRouteWithParams(ROUTES.MEET, {
                                  courseId: session.courseId,
                                })
                              )
                            }
                            className="flex-1"
                          >
                            <Video className="h-4 w-4 mr-2" /> Join Session
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(
                                getRouteWithParams(ROUTES.COURSE_DETAIL, {
                                  courseId: session.courseId,
                                })
                              )
                            }
                            className="flex-1"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="p-3 rounded-full bg-primary/10 mx-auto mb-3 w-fit">
                      <Presentation className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mb-4">
                      You don&apos;t have any active sessions right now
                    </p>
                    <p className="text-sm mb-4">
                      Start a session from one of your courses to begin teaching
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Start a session for:
              </h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <ClipLoader size={24} color="#0f4c81" />
                </div>
              ) : classes.length > 0 ? (
                classes.slice(0, 5).map((classItem) => (
                  <Button
                    key={classItem.courseId}
                    onClick={() => handleStartSession(classItem.courseId)}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={classItem.activeMeetingId}
                  >
                    <Presentation className="mr-2 h-4 w-4" />
                    {classItem.courseName}
                    {classItem.activeMeetingId && (
                      <Badge variant="outline" className="ml-auto">
                        Live
                      </Badge>
                    )}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-2">
                  No courses available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resources Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teaching Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">
                Helpful resources to enhance your virtual teaching experience:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center">
                  <div className="bg-primary/10 w-1.5 h-1.5 rounded-full mr-2"></div>
                  <span>Use screen sharing for presentations</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 w-1.5 h-1.5 rounded-full mr-2"></div>
                  <span>Enable video for better engagement</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 w-1.5 h-1.5 rounded-full mr-2"></div>
                  <span>Use the virtual whiteboard tool</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 w-1.5 h-1.5 rounded-full mr-2"></div>
                  <span>Recordings are available after session</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
