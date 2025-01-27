import React, { useEffect, useState } from "react";
import VideoStream from "../components/videoStream";
import { useParams, useLocation } from "react-router-dom";

const API_ENDPOINT =
  "https://5g08zeyge8.execute-api.eu-north-1.amazonaws.com/dev";

export default function ClassStream() {
  const { classId } = useParams();
  const location = useLocation();
  const [streamInfo, setStreamInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStreamInfo() {
      try {
        const response = await fetch(
          `${API_ENDPOINT}/api/get-stream-info?classId=${classId}`
        );
        if (!response.ok) throw new Error("Failed to fetch stream info");
        const data = await response.json();
        console.log({ data });

        setStreamInfo(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching stream info:", err);
      }
    }

    fetchStreamInfo();
  }, [classId]);
  return <div>Loading...</div>;
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!streamInfo) {
    return <div>Loading...</div>;
  }

  const role = new URLSearchParams(location.search).get("role") || "VIEWER";

  return (
    <div>
      <h1>{role === "MASTER" ? "Teacher" : "Student"} Video Stream</h1>
      <VideoStream
        channelARN={streamInfo.channelARN}
        signalingEndpoint={streamInfo.signalingEndpoint}
        role={role}
      />
    </div>
  );
}
