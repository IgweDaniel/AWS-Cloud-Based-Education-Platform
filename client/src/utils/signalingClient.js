// import t from "amazon-kinesis-video-streams-webrtc";

// console.log(t);

// const SignalingClient =
//   require("amazon-kinesis-video-streams-webrtc").SignalingClient;
export function createSignalingClient(
  channelARN,
  signalingEndpoint,
  role,
  region = "us-north-1"
) {
  return new window.KVSWebRTC.SignalingClient({
    channelARN,
    region,
    role, // VIEWER or MASTER
    signalingEndpoint,
  });
}
