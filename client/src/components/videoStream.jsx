import React, { useEffect, useRef } from "react";
import { createSignalingClient } from "../utils/signalingClient";
import { createPeerConnection } from "../utils/peerConnection";

export default function VideoStream({ channelARN, signalingEndpoint, role }) {
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const signalingClient = useRef(null);

  useEffect(() => {
    async function setupStream() {
      // Create signaling client and peer connection
      signalingClient.current = createSignalingClient(
        channelARN,
        signalingEndpoint,
        role
      );
      peerConnection.current = createPeerConnection();

      if (role === "MASTER") {
        // Get teacher's local media stream (camera and microphone)
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream);
        });

        // Display teacher's own stream
        videoRef.current.srcObject = localStream;

        // Handle SDP Offer
        peerConnection.current.onnegotiationneeded = async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          signalingClient.current.sendSdpOffer(
            peerConnection.current.localDescription
          );
        };
      } else {
        // Handle remote track for students
        peerConnection.current.ontrack = (event) => {
          const [remoteStream] = event.streams;
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play();
        };

        signalingClient.current.on("sdpOffer", async (offer) => {
          await peerConnection.current.setRemoteDescription(offer);
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          signalingClient.current.sendSdpAnswer(
            peerConnection.current.localDescription
          );
        });
      }

      // Handle ICE Candidates
      signalingClient.current.on("iceCandidate", async (candidate) => {
        await peerConnection.current.addIceCandidate(candidate);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          signalingClient.current.sendIceCandidate(event.candidate);
        }
      };

      // Open signaling channel
      signalingClient.current.open();
    }

    setupStream();

    return () => {
      // Cleanup
      if (signalingClient.current) signalingClient.current.close();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [channelARN, signalingEndpoint, role]);

  return (
    <video ref={videoRef} autoPlay playsInline muted={role === "MASTER"} />
  );
}
