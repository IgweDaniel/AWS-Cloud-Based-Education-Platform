import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROUTES } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipLoader } from "react-spinners";

const StartSession = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await authenticatedFetch(
          ENDPOINTS.classes.details(courseId)
        );
        const data = await response.json();
        setClassData(data);
      } catch (err) {
        setError("Failed to load class details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [courseId]);

  const handleStartSession = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ courseId: courseId }),
      });
      const data = await response.json();
      navigate(
        getRouteWithParams(ROUTES.MEET, {
          courseId,
          meetingId: data.meeting.Meeting.MeetingId,
        })
      );
    } catch (err) {
      setError("Failed to start session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ClipLoader size={30} color="#0f4c81" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start Session</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            You are about to start a session for the class:{" "}
            <strong>{classData?.className}</strong>
          </p>
          <Button onClick={handleStartSession} className="w-full">
            Start Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartSession;
