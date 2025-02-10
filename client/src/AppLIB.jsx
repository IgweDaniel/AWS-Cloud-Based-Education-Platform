// import { useState, useEffect, useRef } from "react";

import {
  useLocalVideo,
  useMeetingManager,
} from "amazon-chime-sdk-component-library-react";
import { MeetingSessionConfiguration } from "amazon-chime-sdk-js";
import { useState } from "react";
import { VideoTileGrid } from "amazon-chime-sdk-component-library-react";
const createEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/create-meeting";

const joinEndpoint =
  "https://8dhkivuce0.execute-api.us-east-1.amazonaws.com/dev/join-meeting";

const App = () => {
  const meetingManager = useMeetingManager();
  const [meetingID, setMeetingID] = useState("");

  const {
    tileId,
    isVideoEnabled,
    setIsVideoEnabled,
    toggleVideo,
    hasReachedVideoLimit,
  } = useLocalVideo();

  const toggleCamera = async () => {
    if (isVideoEnabled || !meetingManager.selectedVideoInputDevice) {
      meetingManager.meetingSession?.audioVideo?.stopLocalVideoTile();
      // Change the state to hide the `LocalVideo` tile
      setIsVideoEnabled(false);
    } else {
      await meetingManager.meetingSession?.audioVideo?.startVideoInput(
        meetingManager.selectedVideoInputDevice
      );
      meetingManager.meetingSession?.audioVideo?.startLocalVideoTile();
      // Change the state to display the `LocalVideo` tile
      setIsVideoEnabled(true);
    }
  };
  const startMeeting = async ({ meeting, attendee }) => {
    // Fetch the meeting and attendee data from your server application

    // Initalize the `MeetingSessionConfiguration`
    const meetingSessionConfiguration = new MeetingSessionConfiguration(
      meeting,
      attendee
    );

    // Create a `MeetingSession` using `join()` function with the `MeetingSessionConfiguration`
    await meetingManager.join(meetingSessionConfiguration);

    // At this point you could let users setup their devices, or by default
    // the SDK will select the first device in the list for the kind indicated
    // by `deviceLabels` (the default value is DeviceLabels.AudioAndVideo)
    // ...

    // Start the `MeetingSession` to join the meeting
    await meetingManager.start();
  };

  async function joinMeeting() {
    const response = await fetch(joinEndpoint, {
      method: "POST",
      body: JSON.stringify({ meetingId: meetingID }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    startMeeting({
      meeting: data.meeting.Meeting,
      attendee: data.attendee.Attendee,
    });
  }
  async function createMeeting() {
    const response = await fetch(createEndpoint, {
      method: "POST",
    });

    const data = await response.json();
    startMeeting({
      meeting: data.meeting.Meeting,
      attendee: data.attendee.Attendee,
    });
  }

  // if (meetingManager.meetingStatus) {
  //   return <div>Meeting in progress</div>;
  // }
  console.log("meetingSession", meetingManager.meetingSession);
  console.log("meetingStatus", meetingManager.meetingStatus);

  return (
    <div>
      <h1>Live Class {meetingManager.meetingId}</h1>
      <input
        type="text"
        value={meetingID}
        placeholder="Enter Meeting ID"
        onChange={(e) => setMeetingID(e.target.value)}
      />
      <div style={{ width: "100vw", height: "100vh" }}>
        <VideoTileGrid />
      </div>
      <button onClick={toggleVideo}>
        {isVideoEnabled
          ? "Stop your video"
          : hasReachedVideoLimit
          ? "Has reached the video limit, can not turn on video"
          : "Start your video"}
      </button>
      <button onClick={createMeeting}>Create Meeting</button>
      <button onClick={joinMeeting}>Join Meeting</button>
      <button onClick={toggleCamera}>toggle camera</button>
    </div>
  );
};

export default App;
