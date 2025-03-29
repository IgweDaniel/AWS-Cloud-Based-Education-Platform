import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { authenticatedFetch } from "../utils/fetch";
import { ENDPOINTS } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ClassCard = ({ classItem, userRole }) => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const startMeeting = async () => {
    try {
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ classId: classItem.classId }),
      });
      const data = await response.json();
      const newMeetingId = data.meeting.Meeting.MeetingId;
      navigate(`/classes/${classItem.classId}/meeting/${newMeetingId}`);
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  const joinMeeting = () => {
    navigate(
      `/classes/${classItem.classId}/meeting/${classItem.activeMeetingId}`
    );
  };

  return (
    <Card className="bg-[#3c4043] text-white transition-transform hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-[#8ab4f8]">{classItem.className}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-[#e8eaed]">
          <p>Teacher: {classItem.teacherName}</p>
          {classItem.studentCount && <p>Students: {classItem.studentCount}</p>}
        </div>

        {classItem.activeMeetingId && (
          <Badge className="mb-4 bg-[#34a853] hover:bg-[#34a853]">
            Live Class in Progress
          </Badge>
        )}

        <div className="flex flex-wrap gap-2">
          {userRole === "TEACHER" && classItem.teacherId === user?.userId && (
            <>
              <Button
                onClick={startMeeting}
                disabled={classItem.activeMeetingId}
                className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
              >
                {classItem.activeMeetingId
                  ? "Class in Progress"
                  : "Start Class"}
              </Button>
              <Button
                onClick={() =>
                  navigate(`/classes/${classItem.classId}/students`)
                }
                className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
              >
                Manage Students
              </Button>
            </>
          )}

          {userRole === "STUDENT" && classItem.activeMeetingId && (
            <Button
              onClick={joinMeeting}
              className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
            >
              Join Live Class
            </Button>
          )}

          {userRole === "SUPER_ADMIN" && (
            <>
              <Button
                onClick={() =>
                  navigate(`/admin/class/${classItem.classId}/edit`)
                }
                className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
              >
                Edit Class
              </Button>
              <Button
                onClick={() =>
                  navigate(`/admin/class/${classItem.classId}/students`)
                }
                className="bg-[#8ab4f8] text-[#202124] hover:bg-[#7aa3e7]"
              >
                Manage Students
              </Button>
              <Button
                onClick={() =>
                  navigate(`/admin/class/${classItem.classId}/delete`)
                }
                className="bg-[#ea4335] text-white hover:bg-[#dc3626]"
              >
                Delete Class
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
