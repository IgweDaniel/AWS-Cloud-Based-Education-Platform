const {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  GetMeetingCommand,
  ListMeetingsCommand,
  DeleteMeetingCommand,
} = require("@aws-sdk/client-chime-sdk-meetings");

const region = "us-east-1";
const chimeClient = new ChimeSDKMeetingsClient({
  region,
});

module.exports.createMeeting = async (event) => {
  try {
    // Step 1: Create a new meeting
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken:
        "unique-token-" + Math.random().toString(36).substring(7),
      MediaRegion: "us-east-1",
      ExternalMeetingId: "meeting-" + Math.random().toString(36).substring(7),
    });

    const meeting = await chimeClient.send(createMeetingCommand);
    meeting.Meeting.ExternalMeetingId;
    meeting.Meeting.MeetingId;
    // Step 2: Create an attendee for the meeting
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meeting.Meeting.MeetingId,

      ExternalUserId:
        "external-user-id-" + Math.random().toString(36).substring(7),
    });

    const attendee = await chimeClient.send(createAttendeeCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        meeting,
        attendee,
      }),
    };
  } catch (error) {
    console.error("Error creating meeting:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create meeting" }),
    };
  }
};

module.exports.joinMeeting = async (event) => {
  try {
    const { meetingId } = JSON.parse(event?.body ?? "{}");

    if (!meetingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "MeetingId is required" }),
      };
    }
    const getMeetingCommand = new GetMeetingCommand({
      MeetingId: meetingId,
    });
    const meeting = await chimeClient.send(getMeetingCommand);
    // Step 1: Create an attendee for the existing meeting
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId:
        "external-user-id-" + Math.random().toString(36).substring(7),
    });

    const attendee = await chimeClient.send(createAttendeeCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        meeting,
        attendee,
      }),
    };
  } catch (error) {
    //   TODO catch not found exception
    console.error("Error joining meeting:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to join meeting" }),
    };
  }
};

module.exports.deleteMeeting = async (event) => {
  try {
    const { meetingId } = JSON.parse(event?.body ?? "{}");

    if (!meetingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "MeetingId is required" }),
      };
    }

    const deleteMeetingCommand = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(deleteMeetingCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Meeting deleted successfully" }),
    };
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete meeting" }),
    };
  }
};
