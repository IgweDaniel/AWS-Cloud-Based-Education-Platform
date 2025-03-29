import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../utils/fetch";
import { useAuth } from "../context/auth";
import { ENDPOINTS } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ClipLoader } from "react-spinners";
import DashboardLayout from "@/components/DashboardLayout";
// import { Loader2 as Cliploader } from "lucide-react";

const ClassDetails = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startMeeting = async () => {
    try {
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ classId: classData.classId }),
      });
      const data = await response.json();
      const newMeetingId = data.meeting.Meeting.MeetingId;
      navigate(`/classes/${classData.classId}/meeting/${newMeetingId}`);
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  const fetchClassDetails = async () => {
    try {
      const response = await authenticatedFetch(
        ENDPOINTS.classes.details(classId)
      );
      const data = await response.json();
      setClassData(data);
    } catch (error) {
      console.error("Failed to load class details:", error);
      setError("Failed to load class details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classData) {
      fetchClassDetails();
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] text-white p-8 flex items-center justify-center">
        <ClipLoader size={40} color="#8ab4f8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#202124] text-white p-8 flex flex-col items-center justify-center">
        <div className="text-[#ea4335] text-xl mb-4">Error</div>
        <div className="text-white">{error}</div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Teacher Dashboard">
      <div className="">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            {classData.className}
          </h1>
          {user.role === "TEACHER" && classData.teacherId === user.sub && (
            <Button
              onClick={() => navigate(`/classes/${classId}/students`)}
              className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
            >
              Manage Students
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-[#3c4043] text-white">
            <CardHeader>
              <CardTitle className="text-[#8ab4f8]">Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[#e8eaed]">{classData.teacherName}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#3c4043] text-white">
            <CardHeader>
              <CardTitle className="text-[#8ab4f8]">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[#e8eaed]">
                {classData.studentCount} enrolled
              </div>
            </CardContent>
          </Card>

          {classData.activeMeeting ? (
            <Card className="bg-[#3c4043] text-white">
              <CardHeader>
                <CardTitle className="text-[#8ab4f8]">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Badge className="w-fit bg-[#34a853] hover:bg-[#34a853]">
                    Live Class in Progress
                  </Badge>
                  <div className="text-[#e8eaed]">Meeting is active</div>
                </div>
                <Button
                  onClick={() =>
                    navigate(
                      `/classes/${classId}/meeting/${classData.activeMeeting}`
                    )
                  }
                  className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7] w-full"
                >
                  Join Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#3c4043] text-white">
              <CardHeader>
                <CardTitle className="text-[#8ab4f8]">Class Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={startMeeting}
                  className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7] w-full"
                >
                  Start Class
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassDetails;
