import { useState, useEffect, useRef } from "react";
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

const logger = new ConsoleLogger("MyLogger", LogLevel.INFO);
const deviceController = new DefaultDeviceController(logger);
const createEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/create-meeting";

const joinEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/join-meeting";

const App = () => {
  const [meetingSession, setMeetingSession] = useState(null);
  const [meetingID, setMeetingID] = useState("");
  const [videoTiles, setVideoTiles] = useState([]); // State to manage video tiles
  const [isLoading, setIsLoading] = useState(true); // State to manage loading spinner
  const videoGridRef = useRef(null); // Ref for the video grid container
  const localVideoRef = useRef(null); // Ref for the local video element

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
            // Bind the local video tile to the local video element
            meetingSession.audioVideo.bindVideoElement(
              tileState.tileId,
              localVideoRef.current
            );
            return;
          }

          // Handle remote video tiles
          setVideoTiles((prevTiles) => {
            const existingTile = prevTiles.find(
              (tile) => tile.tileId === tileState.tileId
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

  // Function to start the meeting
  const startMeeting = async () => {
    try {
      setIsLoading(true); // Show loading spinner
      const response = await fetch(createEndpoint, {
        method: "POST",
      });
      const data = await response.json();
      setMeetingID(data.meeting.Meeting.MeetingId);
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };
  const joinMeetingHandler = async () => {
    try {
      setIsLoading(true); // Show loading spinner
      const response = await fetch(joinEndpoint, {
        method: "POST",
        body: JSON.stringify({ meetingId: meetingID }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setMeetingID(data.meeting.Meeting.MeetingId);
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  // Effect to bind video tiles to HTML video elements
  useEffect(() => {
    if (videoGridRef.current) {
      videoGridRef.current.innerHTML = ""; // Clear the video grid

      videoTiles.forEach((tile) => {
        const videoElement = document.createElement("video");
        videoElement.setAttribute("playsinline", true);
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.display = "none"; // Initially hide the video element
        videoGridRef.current.appendChild(videoElement);

        // Add event listener for the `loadeddata` event
        videoElement.addEventListener("loadeddata", () => {
          videoElement.style.display = "block"; // Show the video element when ready
          setIsLoading(false); // Hide loading spinner when video is ready
        });

        meetingSession.audioVideo.bindVideoElement(tile.tileId, videoElement);
      });
    }
  }, [videoTiles, meetingSession]);

  return (
    <div>
      <h1>Live Class {meetingID}</h1>
      <button onClick={startMeeting}>Start Meeting</button>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner">LOADING....</div>
        </div>
      )}

      <div>
        <input
          type="text"
          value={meetingID}
          placeholder="Enter Meeting ID"
          onChange={(e) => setMeetingID(e.target.value)}
        />
        <button onClick={joinMeetingHandler}>Join Meeting</button>
      </div>

      {/* Video Grid */}
      <div
        ref={videoGridRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          marginTop: "20px",
        }}
      ></div>

      {/* Local Video */}
      <div style={{ marginTop: "20px" }}>
        <h2>Your Video</h2>
        <video
          ref={localVideoRef}
          style={{
            width: "200px",
            height: "150px",
            border: "1px solid black",
            display: "none", // Initially hide the local video element
          }}
          autoPlay
          playsInline
          onLoadedData={() => {
            localVideoRef.current.style.display = "block"; // Show the local video element when ready
            setIsLoading(false); // Hide loading spinner when local video is ready
          }}
        ></video>
      </div>

      {/* Audio Element */}
      <audio id="audio-element" autoPlay></audio>
    </div>
  );
};

export default App;
