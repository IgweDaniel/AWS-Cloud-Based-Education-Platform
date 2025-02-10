import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import { FcEndCall } from "react-icons/fc";
const logger = new ConsoleLogger("MyLogger", LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);
const joinEndpoint = "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/join-meeting";

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#202124',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    right: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  meetingInfo: {
    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(60, 64, 67, 0.8)',
    borderRadius: '8px',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: '1rem',
    padding: '1rem',
    height: '100vh',
    paddingBottom: '6rem',
  },
  videoTile: {
    backgroundColor: '#3c4043',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '16/9',
    position: 'relative',
  },
  localVideo: {
    position: 'fixed',
    bottom: '6rem',
    right: '1rem',
    width: 'clamp(120px, 20vw, 240px)',
    aspectRatio: '16/9',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    zIndex: 20,
  },
  controls: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'rgba(32, 33, 36, 0.95)',
    padding: '0.75rem',
    borderRadius: '2rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    zIndex: 30,
    '@media (maxWidth: 480px)': {
      width: 'calc(100% - 2rem)',
      justifyContent: 'center',
    },
  },
  controlButton: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#3c4043',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#4a4a4a',
    },
    '&.danger': {
      backgroundColor: '#ea4335',
    },
    '&.danger:hover': {
      backgroundColor: '#dc3626',
    },
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32, 33, 36, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
    color: '#fff',
  },
};

const Meet = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meetingSession, setMeetingSession] = useState(null);
  const [videoTiles, setVideoTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const videoGridRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (meetingId) {
        joinMeetingHandler();
    }
    return () => {
      if (meetingSession) {
        meetingSession.audioVideo.stop();
      }
    };
  }, []);

  // Function to join the meeting
  const joinMeeting = async (meetingResponse, attendeeResponse) => {
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

      // Step 3: Set up video tile observers
      const observer = {
        videoTileDidUpdate: (tileState) => {
          // Ignore content share tiles
          if (tileState.isContent) {
            return;
          }

          // Handle local video tile
          if (tileState.localTile) {
            // Only bind local video to the local video element
            meetingSession.audioVideo.bindVideoElement(
              tileState.tileId,
              localVideoRef.current
            );
            return; // Important: return here to prevent local tile from being added to videoTiles
          }

          // Handle remote video tiles - only add if it's not already in the list
          setVideoTiles((prevTiles) => {
            const existingTile = prevTiles.find(
              (tile) => tile.boundAttendeeId === tileState.boundAttendeeId
            );
            if (!existingTile) {
              return [...prevTiles, tileState];
            }
            return prevTiles;
          });
        },

        videoTileWasRemoved: (tileId) => {
          // Remove the tile from the videoTiles state
          setVideoTiles((prevTiles) =>
            prevTiles.filter((tile) => tile.tileId !== tileId)
          );
        },
      };

      meetingSession.audioVideo.addObserver(observer);

      // Step 4: Start the meeting session
      meetingSession.audioVideo.start();
      meetingSession.audioVideo.startLocalVideoTile(); // Start local video

      setMeetingSession(meetingSession);
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };

  const joinMeetingHandler = async () => {
    try {
      setIsLoading(true); // Show loading spinner
      const response = await fetch(joinEndpoint, {
        method: "POST",
        body: JSON.stringify({ meetingId }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
    //   setMeetingID(data.meeting.Meeting.MeetingId);
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error starting meeting:", error);
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

  // Effect to bind video tiles to HTML video elements
  useEffect(() => {
    if (!videoGridRef.current || !meetingSession) return;

    // Clear existing content
    videoGridRef.current.innerHTML = '';

    // Handle remote video tiles
    videoTiles.forEach((tile) => {
      const videoContainer = document.createElement('div');
      Object.assign(videoContainer.style, {
        backgroundColor: '#3c4043',
        borderRadius: '8px',
        overflow: 'hidden',
        aspectRatio: '16/9'
      });

      const videoElement = document.createElement('video');
      videoElement.setAttribute('playsinline', true);
      Object.assign(videoElement.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'none'
      });
      
      videoContainer.appendChild(videoElement);
      videoGridRef.current.appendChild(videoContainer);

      videoElement.addEventListener('loadeddata', () => {
        videoElement.style.display = 'block';
        setIsLoading(false);
      });

      meetingSession.audioVideo.bindVideoElement(tile.tileId, videoElement);
    });

    // Cleanup function
    return () => {
      if (videoGridRef.current) {
        videoGridRef.current.innerHTML = '';
      }
    };
  }, [videoTiles, meetingSession]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.meetingInfo}>
          Meeting ID: {meetingId}
        </div>
      </div>

      <div ref={videoGridRef} style={styles.videoGrid}>
        {/* Video tiles will be added here dynamically */}
      </div>

      <div style={styles.localVideo}>
        <video
          ref={localVideoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
          {isMuted ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button 
          onClick={() => toggleVideo()}
          style={styles.controlButton}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <FaVideo size={20}  color="#fff" /> : <FaVideoSlash size={20} color="#fff" />}
        </button>
        <button 
          onClick={() => {
            meetingSession?.audioVideo.stop();
            navigate('/');
          }}
          style={{ ...styles.controlButton, ...styles.danger }}
          title="Leave meeting"
        >
          <FcEndCall />
        </button>
      </div>

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>
            Joining meeting...
          </div>
        </div>
      )}
    </div>
  );
};

export default Meet;
