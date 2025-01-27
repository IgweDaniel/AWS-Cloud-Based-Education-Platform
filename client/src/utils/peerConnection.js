export function createPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.kinesisvideo.us-north-1.amazonaws.com:443" }, // AWS Kinesis STUN server
    ],
  });
}
