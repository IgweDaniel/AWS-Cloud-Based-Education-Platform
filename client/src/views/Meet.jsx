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

import { authenticatedFetch } from "../utils/fetch";
import { ENDPOINTS } from "../constants";

const logger = new ConsoleLogger("MyLogger", LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);

const styles = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#202124",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: "1rem",
    left: "1rem",
    right: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  meetingInfo: {
    fontSize: "clamp(0.875rem, 2vw, 1rem)",
    padding: "0.5rem 1rem",
    backgroundColor: "rgba(60, 64, 67, 0.8)",
    borderRadius: "8px",
  },
  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "1rem",
    padding: "1rem",
    height: "100vh",
    paddingBottom: "6rem",
  },
  videoTile: {
    backgroundColor: "#3c4043",
    borderRadius: "8px",
    overflow: "hidden",
    aspectRatio: "16/9",
    position: "relative",
  },
  localVideo: {
    position: "fixed",
    bottom: "6rem",
    right: "1rem",
    width: "clamp(120px, 20vw, 240px)",
    aspectRatio: "16/9",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 20,
  },
  controls: {
    position: "fixed",
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "0.5rem",
    backgroundColor: "rgba(32, 33, 36, 0.95)",
    padding: "0.75rem",
    borderRadius: "2rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 30,
    "@media (maxWidth: 480px)": {
      width: "calc(100% - 2rem)",
      justifyContent: "center",
    },
  },
  controlButton: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#3c4043",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // fontSize: "1.25rem",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#4a4a4a",
    },
    "&.danger": {
      backgroundColor: "#ea4335",
    },
    "&.danger:hover": {
      backgroundColor: "#dc3626",
    },
  },
  loadingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(32, 33, 36, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  loadingText: {
    fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
    color: "#fff",
  },
};

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

  const checkMeetingStatus = async (meetingId) => {
    try {
      const response = await authenticatedFetch(
        `/meetings/${meetingId}/status`
      );
      const data = await response.json();

      if (!data.active) {
        // Meeting no longer exists
        // Redirect user or show appropriate message
        navigate("/dashboard", {
          state: { message: "The meeting has ended" },
        });
      }

      return data.active;
    } catch (error) {
      console.error("Error checking meeting status:", error);
      return false;
    }
  };

  // Use in component with useEffect
  // FIXME: check if this is necce
  // useEffect(() => {
  //   let statusInterval;

  //   if (meetingId) {
  //     // Check status immediately
  //     checkMeetingStatus(meetingId);

  //     // Then check every minute
  //     statusInterval = setInterval(() => {
  //       checkMeetingStatus(meetingId);
  //     }, 60000);
  //   }

  //   return () => {
  //     if (statusInterval) clearInterval(statusInterval);
  //   };
  // }, [meetingId]);

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
          navigate("/dashboard", {
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
            // return prevTiles.filter((tile) => tile.tileId !== tileState.tileId);
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            style={styles.controlButton}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => {
            cleanupMeeting();
            navigate("/dashboard");
          }}
          style={styles.controlButton}
          title="Return to Dashboard"
        >
          Back
        </button>
        <div style={styles.meetingInfo}>
          <div>Meeting ID: {meetingId}</div>
          <div style={{ fontSize: "0.875em", opacity: 0.8 }}>
            {user?.role === "TEACHER" ? "Teaching" : "Attending"} Class
          </div>
        </div>
      </div>

      <div ref={videoGridRef} style={styles.videoGrid}>
        {/* Video tiles will be added here dynamically */}
      </div>

      <div style={styles.localVideo}>
        <video
          ref={localVideoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          autoPlay
          playsInline
          muted
        />
      </div>

      <div style={styles.controls}>
        <button
          onClick={() => toggleAudio()}
          style={styles.controlButton}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <FaMicrophone size={30} color="#fff" />
          ) : (
            <FaMicrophoneSlash size={30} color="#fff" />
          )}
        </button>
        <button
          onClick={() => toggleVideo()}
          style={styles.controlButton}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? (
            <FaVideo size={20} color="#fff" />
          ) : (
            <FaVideoSlash size={20} color="#fff" />
          )}
        </button>
        <button
          onClick={async () => {
            await cleanupMeeting();
            navigate("/");
          }}
          style={{ ...styles.controlButton, ...styles.danger }}
          title="Leave meeting"
        >
          <FcEndCall size={20} color="#fff" />
        </button>
      </div>

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Joining meeting...</div>
        </div>
      )}
    </div>
  );
};

export default Meet;
