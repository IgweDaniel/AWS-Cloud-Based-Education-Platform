import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/fetch";
import { useAuth } from "../context/auth";
import { ENDPOINTS } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Users,
  Video,
  CheckCircle2,
} from "lucide-react";

const ClassDetails = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified mock resources for a basic UI
  const resources = [
    {
      id: 1,
      title: "Course Syllabus",
      type: "pdf",
      size: "245 KB",
      date: "2025-01-15",
    },
    {
      id: 2,
      title: "Lecture Slides Week 10",
      type: "ppt",
      size: "3.2 MB",
      date: "2025-04-01",
    },
  ];

  const startMeeting = async () => {
    try {
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      navigate(
        `/classes/${courseId}/meeting/${data.meeting.Meeting.MeetingId}`
      );
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await authenticatedFetch(
          ENDPOINTS.classes.details(courseId)
        );
        if (!response.ok) {
          throw new Error("Failed to fetch class details");
        }
        const data = await response.json();
        setClassData(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ClipLoader size={40} color="#0f4c81" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center">
        <div className="text-destructive text-xl mb-4">Error</div>
        <div className="text-foreground">{error}</div>
      </div>
    );
  }

  const isTeacher =
    user.role === "TEACHER" && classData.teacherId === user.userId;
  // const isAdmin = user.role === "SUPER_ADMIN";

  return (
    <DashboardLayout title="Course Details">
      <div className="space-y-8">
        {/* Course Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold campus-text-gradient">
                  {classData.className}
                </h1>
                {classData.activeMeeting && (
                  <Badge variant="success" className="text-xs">
                    Live Now
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                Course ID: {classData.classId}
              </p>
            </div>

            <div className="flex gap-2">
              {isTeacher && (
                <Button
                  onClick={
                    classData.activeMeeting
                      ? () =>
                          navigate(
                            `/classes/${courseId}/meeting/${classData.activeMeeting}`
                          )
                      : startMeeting
                  }
                  className={
                    classData.activeMeeting
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-primary hover:bg-primary/90"
                  }
                  size="sm"
                >
                  {classData.activeMeeting ? (
                    <>
                      <Video className="mr-2 h-4 w-4" /> Join Active Session
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" /> Start Session
                    </>
                  )}
                </Button>
              )}

              {!isTeacher && classData.activeMeeting && (
                <Button
                  onClick={() =>
                    navigate(
                      `/classes/${courseId}/meeting/${classData.activeMeeting}`
                    )
                  }
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Video className="mr-2 h-4 w-4" /> Join Live Session
                </Button>
              )}
            </div>
          </div>

          {/* Course meta information */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span className="font-medium mr-1">Instructor:</span>{" "}
              {classData.teacherName || "Unassigned"}
            </div>
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span className="font-medium mr-1">Students:</span>{" "}
              {classData.studentCount || 0} enrolled
            </div>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="font-medium mr-1">Schedule:</span> MWF
              10:00-11:30 AM
            </div>
          </div>
        </div>

        {/* Content Tabs - Simplified to focus on live meeting */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:w-auto w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Focused on meeting status */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Course Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classData.activeMeeting ? (
                  <div className="bg-success/10 border border-success/20 text-success-foreground p-4 rounded-md">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-success/20 rounded-full mr-3">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Live Class in Progress
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Join the current session to participate in the
                          lecture.
                        </p>
                      </div>
                      <Button
                        className="ml-auto"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/classes/${courseId}/meeting/${classData.activeMeeting}`
                          )
                        }
                      >
                        Join Now
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border p-4 rounded-md">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-muted rounded-full mr-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">No Active Session</div>
                        <p className="text-sm text-muted-foreground">
                          Check back later for the next scheduled session or
                          start a new one.
                        </p>
                      </div>
                      {isTeacher && (
                        <Button
                          className="ml-auto"
                          size="sm"
                          onClick={startMeeting}
                        >
                          Start Session
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students list - Simple version */}
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                {classData.students && classData.students.length > 0 ? (
                  <div className="divide-y">
                    {classData.students.map((student, index) => (
                      <div key={index} className="py-3 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3">
                          <span className="font-medium text-sm">
                            {student.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">{student}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No students enrolled in this course.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab - Simplified */}
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Course Resources</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-full mr-3">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {resource.type.toUpperCase()} • {resource.size} •
                          Added {resource.date}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClassDetails;
