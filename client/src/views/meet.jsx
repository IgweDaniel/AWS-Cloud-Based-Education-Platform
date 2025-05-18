import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";

import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { FcEndCall } from "react-icons/fc";

import { authenticatedFetch } from "../lib/fetch";
import { ENDPOINTS, ROUTES } from "../constants";

// UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const logger = new ConsoleLogger("MyLogger", LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

// TODO: listen for meeting ended event and redirect
// TODO: call the end meeting session if teacher
const Meet = () => {
  const { classId, meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetingSession, setMeetingSession] = useState(null);
  const [videoTiles, setVideoTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null);
  const videoGridRef = useRef(null);
  const localVideoRef = useRef(null);
  const [localTileID, setLocalTileID] = useState(null);

  useEffect(() => {
    if (!meetingSession) {
      joinMeetingHandler();
    }
    return () => {
      if (meetingSession) {
        cleanupMeeting();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupMeeting = async () => {
    try {
      await Promise.all([
        meetingSession?.audioVideo.stopAudioInput(),
        meetingSession?.audioVideo.stopVideoInput(),
      ]);
      meetingSession?.audioVideo.unbindAudioElement();
      meetingSession?.audioVideo.stop();
      setMeetingSession(null);
    } catch (error) {
      console.error("Error cleaning up meeting:", error);
    }
  };

  const joinMeetingHandler = async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch(ENDPOINTS.meetings.join, {
        method: "POST",
        body: JSON.stringify({
          meetingId,
          classId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.statusCode === 404) {
          // Meeting was deleted by Chime
          //TODO: Show a user-friendly message
          navigate(ROUTES.DASHBOARD, {
            state: {
              message: "This meeting has ended or is no longer available",
            },
          });
          return;
        }
        throw new Error(error.message || "Failed to join meeting");
      }

      const data = await response.json();
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error joining meeting:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const joinMeeting = async (meetingResponse, attendeeResponse) => {
    try {
      const configuration = new MeetingSessionConfiguration(
        meetingResponse.Meeting,
        attendeeResponse.Attendee
      );

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      // Initialize devices
      await initializeDevices(meetingSession);

      // Start meeting
      meetingSession.audioVideo.start();
      meetingSession.audioVideo.startLocalVideoTile();

      // Set up video binding
      localVideoRef.current.addEventListener("loadeddata", () => {
        setIsLoading(false);
      });

      setMeetingSession(meetingSession);
    } catch (error) {
      console.error("Error setting up meeting:", error);
      setError("Failed to initialize meeting");
      setIsLoading(false);
    }
  };

  const initializeDevices = async (meetingSession) => {
    const audioInputDevices =
      await meetingSession.audioVideo.listAudioInputDevices();
    const audioOutputDevices =
      await meetingSession.audioVideo.listAudioOutputDevices();
    const videoInputDevices =
      await meetingSession.audioVideo.listVideoInputDevices();

    if (audioInputDevices.length > 0) {
      await meetingSession.audioVideo.startAudioInput(
        audioInputDevices[0].deviceId
      );
    }
    if (audioOutputDevices.length > 0) {
      await meetingSession.audioVideo.chooseAudioOutput(
        audioOutputDevices[0].deviceId
      );
    }
    if (videoInputDevices.length > 0) {
      await meetingSession.audioVideo.startVideoInput(
        videoInputDevices[0].deviceId
      );
    }
  };

  // Function to toggle audio
  const toggleAudio = async () => {
    if (meetingSession) {
      if (isMuted) {
        await meetingSession.audioVideo.resubscribe();
      } else {
        await meetingSession.audioVideo.unsubscribe();
      }
      setIsMuted(!isMuted);
    }
  };

  // Function to toggle video
  const toggleVideo = async () => {
    if (meetingSession) {
      if (isVideoOff) {
        await meetingSession.audioVideo.startLocalVideoTile();
      } else {
        await meetingSession.audioVideo.stopLocalVideoTile();
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => {
    // Step 3: Set up video tile observers
    const observer = {
      videoTileDidUpdate: (tileState) => {
        if (
          !tileState.localTile ||
          !tileState.tileId ||
          localTileID === tileState.tileId
        ) {
          return;
        }
        setLocalTileID(tileState.tileId);
      },
    };

    if (meetingSession) {
      meetingSession.audioVideo.addObserver(observer);
    }

    return () => {
      if (meetingSession) {
        meetingSession.audioVideo.removeObserver(observer);
      }
    };
  }, [meetingSession, localTileID]);

  useEffect(() => {
    const remoteObserver = {
      videoTileDidUpdate: (tileState) => {
        if (
          tileState?.boundAttendeeId &&
          tileState?.tileId &&
          !tileState.isContent &&
          !tileState.localTile
        ) {
          setVideoTiles((prevTiles) => {
            const existingTile = prevTiles.find(
              (tile) => tile.tileId === tileState.tileId
            );
            if (!existingTile) {
              return [...prevTiles, tileState];
            }
            return prevTiles;
          });
        }
      },
      videoTileWasRemoved: (tileId) => {
        setVideoTiles((prevTiles) =>
          prevTiles.filter((tile) => tile.tileId !== tileId)
        );
      },
    };

    if (meetingSession) {
      meetingSession.audioVideo.addObserver(remoteObserver);
    }

    return () => {
      if (meetingSession) {
        meetingSession.audioVideo.removeObserver(remoteObserver);
      }
    };
  }, [meetingSession]);

  useEffect(() => {
    const eventObserver = {
      eventDidReceive(name, attributes) {
        // Handle a meeting event.
        switch (name) {
          case "meetingEnded":
            console.log(`Meeting has ended ${attributes} in `, attributes);
            navigate(ROUTES.DASHBOARD, {
              state: {
                message: "This meeting has ended",
              },
            });
            break;

          default:
            break;
        }
      },
    };
    if (!meetingSession) return;

    meetingSession.eventController.addObserver(eventObserver);
    return () => {
      if (meetingSession) {
        meetingSession.eventController.removeObserver(eventObserver);
      }
    };
  }, [meetingSession,navigate]);

  useEffect(() => {
    if (meetingSession) {
      meetingSession.audioVideo.bindVideoElement(
        localTileID,
        localVideoRef.current
      );
    }
  }, [meetingSession, localTileID]);

  // Effect to bind video tiles to HTML video elements
  useEffect(() => {
    console.log({ videoTiles });

    // console.log({ videoTiles, localTile });
    if (!videoGridRef.current || !meetingSession) return;

    // Clear existing content
    videoGridRef.current.innerHTML = "";

    // Handle remote video tiles
    videoTiles.forEach((tile) => {
      const videoContainer = document.createElement("div");
      Object.assign(videoContainer.style, {
        backgroundColor: "#3c4043",
        borderRadius: "8px",
        overflow: "hidden",
        aspectRatio: "16/9",
      });

      const videoElement = document.createElement("video");
      videoElement.setAttribute("playsinline", true);
      Object.assign(videoElement.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "none",
      });

      videoContainer.appendChild(videoElement);
      videoGridRef.current.appendChild(videoContainer);

      videoElement.addEventListener("loadeddata", () => {
        videoElement.style.display = "block";
        // setIsLoading(false);
      });

      meetingSession.audioVideo.bindVideoElement(tile.tileId, videoElement);
    });

    // Cleanup function
  }, [videoTiles, meetingSession]);

  // --- UI ---
  if (error) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center">
        <Card className="bg-destructive text-destructive-foreground border-destructive shadow-lg">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              variant="outline"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1">
            Meeting ID: {meetingId}
          </Badge>
          <span className="text-muted-foreground text-xs ml-2">
            Class: {classId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </header>

      {/* Video Grid */}
      <main className="pt-20 pb-32 px-2 md:px-8">
        <Card className="w-full max-w-6xl mx-auto bg-card/80 shadow-lg border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FaVideo className="text-primary" />
              Live Meeting
            </CardTitle>
            {isLoading && (
              <Badge variant="secondary" className="animate-pulse">
                Connecting…
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div
              ref={videoGridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[40vh]"
            >
              {/* Render remote video tiles here dynamically */}
            </div>
            {/* Local video preview */}
            <div className="fixed bottom-32 right-8 w-56 max-w-xs aspect-video rounded-lg overflow-hidden shadow-lg z-20 bg-muted border border-border">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-background/80 text-xs px-2 py-0.5 rounded">
                You
              </span>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-card/95 px-6 py-3 rounded-2xl shadow-lg z-30 border border-border">
        <Button
          variant={isMuted ? "outline" : "default"}
          size="icon"
          onClick={toggleAudio}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </Button>
        <Button
          variant={isVideoOff ? "outline" : "default"}
          size="icon"
          onClick={toggleVideo}
          aria-label={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={async () => {
            await cleanupMeeting();
            navigate(ROUTES.HOME);
          }}
          aria-label="Leave meeting"
        >
          <FcEndCall className="text-lg" />
        </Button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
          <span className="text-xl font-semibold text-primary animate-pulse">
            Connecting to meeting…
          </span>
        </div>
      )}
    </div>
  );
};

export default Meet;
