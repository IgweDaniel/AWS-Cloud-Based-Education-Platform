const {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  GetMeetingCommand,
  ListMeetingsCommand,
  DeleteMeetingCommand,
} = require("@aws-sdk/client-chime-sdk-meetings");

const { CognitoJwtVerifier }  = require( "aws-jwt-verify");

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.CLIENT_ID,
});

const authenticate = async (event) => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    return await verifier.verify(token);
  } catch (err) {
    console.error('Authentication error:', err);
    throw new Error('Invalid token');
  }
};

const region = "us-east-1";
const chimeClient = new ChimeSDKMeetingsClient({
  region,
});

// TODO: bad reques handling
module.exports.createMeeting = async (event) => {
  try {
    const userData = await authenticate(event);
    console.log({userData});
    
    const userId = userData.sub; 
    // const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "UserId is required" }),
      };
    }
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

      ExternalUserId: userId,
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
      statusCode: error.message === 'Invalid token' ? 401 : 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

module.exports.joinMeeting = async (event) => {
  try {
    const {
      meetingId,
      // userId = "external-user-id-" + Math.random().toString(36).substring(7),
    } = JSON.parse(event?.body ?? "{}");

    const userData = await authenticate(event);
    console.log({userData});
    
    const userId = userData.sub; 

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
      ExternalUserId: userId,
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
      statusCode: error.message === 'Invalid token' ? 401 : 500,
      body: JSON.stringify({ error: error.message }),
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
