/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import { useRef } from "react";

// Component for individual video tiles
export const VideoTile = React.memo(
  ({ tileState, meetingSession, isMuted, isVideoOff }) => {
    const videoRef = useRef(null);
    useEffect(() => {
      if (videoRef.current && meetingSession) {
        meetingSession.audioVideo.bindVideoElement(
          tileState.tileId,
          videoRef.current
        );

        return () => {
          // Optional cleanup if needed
        };
      }
    }, [tileState, meetingSession]);

    return (
      <div
        className="video-container"
        style={{
          backgroundColor: "#3c4043",
          borderRadius: "8px",
          overflow: "hidden",
          aspectRatio: "16/9",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {isVideoOff && (
          <div
            className="video-off-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#606060"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            {/* <span style={{ color: "white", fontSize: "16px" }}>Video Off</span> */}
          </div>
        )}
        <div
          className="label-container"
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "4px 8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {isMuted && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
          <span style={{ color: "white", fontSize: "12px" }}>User</span>
        </div>
      </div>
    );
  }
);

VideoTile.displayName = "VideoTile";

// return (

// );
