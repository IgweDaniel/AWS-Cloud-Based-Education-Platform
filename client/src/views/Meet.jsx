import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserId } from '../utils/userId';

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
const logger = new ConsoleLogger("MyLogger", LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);
const joinEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/join-meeting";

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
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meetingSession, setMeetingSession] = useState(null);
  // const meetingSessionf(null);
  const [videoTiles, setVideoTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const videoGridRef = useRef(null);
  const localVideoRef = useRef(null);

  // const [localAttendeeID, setLocalAttendeeID] = useState(null);
  const [localTileID, setLocalTileID] = useState(null);

  // const [localTile, setLocalTile] = useState(null);
  useEffect(() => {
    if (!meetingSession) {
      (async () => {
        await joinMeetingHandler();
      })();
    }
    return () => {
      if (meetingSession) {
        meetingSession.audioVideo.stop();
      }
    };
  }, []);

  // Function to join the meeting
  const joinMeeting = async (meetingResponse, attendeeResponse) => {
    logger.info("Joining meeting...");
    try {
      // Step 1: Initialize the meeting session
      const configuration = new MeetingSessionConfiguration(
        meetingResponse.Meeting,
        attendeeResponse.Attendee
      );

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      // Step 2: Set up audio and video
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
      } else {
        console.warn("No audio input devices found.");
      }

      if (audioOutputDevices.length > 0) {
        await meetingSession.audioVideo.chooseAudioOutput(
          audioOutputDevices[0].deviceId
        );
      } else {
        console.warn("No audio output devices found.");
      }

      if (videoInputDevices.length > 0) {
        await meetingSession.audioVideo.startVideoInput(
          videoInputDevices[0].deviceId
        );
      } else {
        console.warn("No video input devices found.");
      }

      // Step 4: Start the meeting session
      meetingSession.audioVideo.start();
      meetingSession.audioVideo.startLocalVideoTile(); // Start local video
      // setIsLoading(false);
      localVideoRef.current.addEventListener("loadeddata", () => {
        // videoElement.style.display = "block";
        setIsLoading(false);
      });

      setMeetingSession(meetingSession);
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };

  const joinMeetingHandler = async () => {
    try {
      setIsLoading(true);
      const userId = getUserId();
      const response = await authenticatedFetch(joinEndpoint, {
        method: "POST",
        body: JSON.stringify({ 
          meetingId,
          userId 
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error joining meeting:", error);
      setIsLoading(false);
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => navigate("/")}
          style={styles.controlButton}
          title="Home"
        >
          Home
        </button>
        <div style={styles.meetingInfo}>Meeting ID: {meetingId}</div>
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
          
        
            await Promise.all([
              meetingSession?.audioVideo.stopAudioInput(),
              meetingSession?.audioVideo.stopVideoInput()
            ])
            meetingSession?.audioVideo.unbindAudioElement();
            meetingSession?.audioVideo.stop();
            
            console.log(meetingSession.audioVideo);
            
            setMeetingSession(null);
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
