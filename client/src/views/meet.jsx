import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";

import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultModality,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaCog,
} from "react-icons/fa";
import { MdCallEnd } from "react-icons/md";

import { authenticatedFetch } from "../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROLES, ROUTES } from "../constants";
import { IoAlertCircleSharp } from "react-icons/io5";

// UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VideoTile } from "./video-tile";

const logger = new ConsoleLogger("MyLogger", LogLevel.ERROR);
const deviceController = new DefaultDeviceController(logger);

const Meet = () => {
  const { courseId } = useParams();
  const [meetingId, setMeetingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetingSession, setMeetingSession] = useState(null);
  const [videoTiles, setVideoTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null);
  const [roster, setRoster] = useState(() => new Map());
  // const videoGridRef = useRef(null);
  const localVideoRef = useRef(null);
  const audioElementRef = useRef(null);
  const [localTileID, setLocalTileID] = useState(null);
  const [isDeleteMeetingLoading, setIsDeleteMeetingLoading] = useState(false);

  // Device selection states
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState(null);

  useEffect(() => {
    if (!meetingSession) {
      joinMeetingHandler();
    }
    return () => {
      if (meetingSession) {
        cleanupMeeting();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupMeeting = async () => {
    try {
      if (user.role == ROLES.TEACHER) {
        await endMeeting();
      }
      roster.clear();
      await Promise.all([
        meetingSession?.audioVideo.stopAudioInput(),
        meetingSession?.audioVideo.stopVideoInput(),
      ]);
      meetingSession?.audioVideo.unbindAudioElement();
      meetingSession?.audioVideo.stop();
      setMeetingSession(null);
    } catch (error) {
      console.error("Error cleaning up meeting:", error);
    }
  };

  const joinMeetingHandler = async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch(
        ENDPOINTS.courses.join(courseId),
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.statusCode === 404) {
          // Meeting was deleted by Chime
          //TODO: Show a user-friendly message
          navigate(
            getRouteWithParams(ROUTES.COURSE_DETAIL, {
              courseId,
            }),
            {
              state: {
                message: "This meeting has ended or is no longer available",
              },
            }
          );
          return;
        }
        throw new Error(error.message || "Failed to join meeting");
      }

      const data = await response.json();
      setMeetingId(data.meeting.Meeting.MeetingId);
      await joinMeeting(data.meeting, data.attendee);
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
      setError(error.message);
      setIsLoading(false);
    }
  };
  const endMeeting = async () => {
    try {
      setIsDeleteMeetingLoading(true);
      const response = await authenticatedFetch(
        ENDPOINTS.courses.endSession(courseId),
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.statusCode === 404) {
          return;
        }
        throw new Error(error.message || "Failed to delete meeting");
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      setError(error.message);
    } finally {
      setIsDeleteMeetingLoading(false);
    }
  };

  function volumeHandler(attendeeId, volume, muted, signalStrength) {
    const baseAttendeeId = new DefaultModality(attendeeId).base();
    if (baseAttendeeId !== attendeeId) {
      // Optional: Do not include the content attendee (attendee-id#content) in the roster.
      // See the "Screen and content share" section for details.
      return;
    }

    if (roster.has(attendeeId)) {
      // A null value for any field means that it has not changed.
      roster.get(attendeeId).volume = volume; // a fraction between 0 and 1
      roster.get(attendeeId).muted = muted; // A boolean
      roster.get(attendeeId).signalStrength = signalStrength; // 0 (no signal), 0.5 (weak), 1 (strong)
    } else {
      // Add an attendee.
      // Optional: You can fetch more data, such as attendee name,
      // from your server application and set them here.
      roster.set(attendeeId, {
        attendeeId,
        volume,
        muted,
        signalStrength,
      });
    }
    setRoster(new Map(roster));
  }

  function attendeePrescenceHandler(presentAttendeeId, present) {
    console.log({ presentAttendeeId, present });
    if (!present) {
      roster.delete(presentAttendeeId);
      console.log({ roster });
      setRoster(new Map(roster));
      setVideoTiles((prevTiles) => {
        const filteredTiles = prevTiles.filter(
          (tile) => tile.boundAttendeeId != presentAttendeeId
        );

        return filteredTiles;
      });
      meetingSession.audioVideo.realtimeUnsubscribeFromVolumeIndicator(
        presentAttendeeId,
        volumeHandler
      );
      return;
    }
    roster.set(presentAttendeeId, {
      attendeeId: presentAttendeeId,
    });

    setRoster(new Map(roster));

    meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
      presentAttendeeId,
      volumeHandler
    );
  }

  const joinMeeting = async (meetingResponse, attendeeResponse) => {
    try {
      const configuration = new MeetingSessionConfiguration(
        meetingResponse.Meeting,
        attendeeResponse.Attendee
      );

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      // Initialize devices
      await initializeDevices(meetingSession);

      // Bind audio element if available
      if (audioElementRef.current) {
        try {
          await meetingSession.audioVideo.bindAudioElement(
            audioElementRef.current
          );
          console.log("Successfully bound audio element");
        } catch (e) {
          console.error("Failed to bind audio element", e);
          // Continue anyway, as video might still work
        }
      }

      // Start meeting
      meetingSession.audioVideo.start();
      meetingSession.audioVideo.startLocalVideoTile();

      // Set up video binding
      localVideoRef.current.addEventListener("loadeddata", () => {
        setIsLoading(false);
      });

      setMeetingSession(meetingSession);
    } catch (error) {
      console.error("Error setting up meeting:", error);
      setError("Failed to initialize meeting");
      setIsLoading(false);
    }
  };

  const initializeDevices = async (meetingSession) => {
    const audioInputDevices =
      await meetingSession.audioVideo.listAudioInputDevices();
    const audioOutputDevices =
      await meetingSession.audioVideo.listAudioOutputDevices();
    const videoInputDevices =
      await meetingSession.audioVideo.listVideoInputDevices();

    setAudioInputDevices(audioInputDevices);
    setAudioOutputDevices(audioOutputDevices);
    setVideoInputDevices(videoInputDevices);

    try {
      // Set up default audio input if available
      if (audioInputDevices.length > 0) {
        const defaultDevice = audioInputDevices[0];
        await meetingSession.audioVideo.startAudioInput(defaultDevice.deviceId);
        setSelectedAudioInput(defaultDevice);
        console.log("Using audio input device:", defaultDevice.label);
      } else {
        console.warn("No audio input devices found!");
      }

      // Set up default audio output if available
      if (audioOutputDevices.length > 0) {
        const defaultDevice = audioOutputDevices[0];
        await meetingSession.audioVideo.chooseAudioOutput(
          defaultDevice.deviceId
        );
        setSelectedAudioOutput(defaultDevice);
        console.log("Using audio output device:", defaultDevice.label);
      } else {
        console.warn("No audio output devices found!");
      }

      // Set up default video input if available
      if (videoInputDevices.length > 0) {
        const defaultDevice = videoInputDevices[0];
        await meetingSession.audioVideo.startVideoInput(defaultDevice.deviceId);
        setSelectedVideoInput(defaultDevice);
        console.log("Using video input device:", defaultDevice.label);
      } else {
        console.warn("No video input devices found!");
      }
    } catch (err) {
      console.error("Error initializing devices:", err);
      setError(
        "Failed to access media devices. Please ensure you've granted browser permissions."
      );
    }
  };

  // Function to toggle audio
  const toggleAudio = async () => {
    if (!meetingSession) return;
    if (isMuted) {
      meetingSession.audioVideo.realtimeUnmuteLocalAudio();
    } else {
      meetingSession.audioVideo.realtimeMuteLocalAudio();
    }
  };

  // Function to toggle video
  const toggleVideo = async () => {
    if (meetingSession) {
      if (isVideoOff) {
        await meetingSession.audioVideo.startVideoInput(selectedVideoInput);
        await meetingSession.audioVideo.startLocalVideoTile();
      } else {
        await meetingSession.audioVideo.stopVideoInput();
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
          roster.get(tileState.boundAttendeeId).videoEnabled =
            tileState.boundVideoStream.active;
          setRoster(new Map(roster));

          setVideoTiles((prevTiles) => {
            const filteredTiles = prevTiles.filter(
              (tile) => tile.boundAttendeeId != tileState.boundAttendeeId
            );

            return [...filteredTiles, tileState];
          });
        }
      },
      videoTileWasRemoved: (tileId) => {
        const tileIndex = videoTiles.findIndex(
          (tile) => tile.tileId === tileId
        );
        if (tileIndex !== -1) {
          const removedTile = videoTiles[tileIndex];
          console.log({
            videoTilesAttendee: roster.get(removedTile.boundAttendeeId)
              .attendeeId,
          });

          // Access roster data for the removed attendee if it exists
          roster.get(removedTile.boundAttendeeId).videoEnabled = false;
          setRoster(new Map(roster));
          return;
        }
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
  }, [meetingSession, roster, videoTiles]);

  useEffect(() => {
    const eventObserver = {
      eventDidReceive(name, attributes) {
        // Handle a meeting event.
        switch (name) {
          case "meetingEnded":
            console.log("Meeting has ended", attributes);
            navigate(ROUTES.DASHBOARD, {
              state: {
                message: "The meeting has ended",
              },
            });
            break;
          case "audioInputFailed":
            console.error("Audio input failed", attributes);
            setError(
              "Audio input failed. Please check your microphone settings."
            );
            break;
          case "audioOutputFailed":
            console.error("Audio output failed", attributes);
            setError(
              "Audio output failed. Please check your speaker settings."
            );
            break;
          default:
            console.log(`Received event: ${name}`, attributes);
            break;
        }
      },
    };
    if (!meetingSession) return;

    meetingSession.eventController.addObserver(eventObserver);
    return () => {
      if (meetingSession) {
        meetingSession.eventController.removeObserver(eventObserver);
      }
    };
  }, [meetingSession, navigate]);

  useEffect(() => {
    if (meetingSession) {
      meetingSession.audioVideo.bindVideoElement(
        localTileID,
        localVideoRef.current
      );
    }
  }, [meetingSession, localTileID]);

  // After meeting session creation, let's set up audio
  useEffect(() => {
    if (meetingSession && audioElementRef.current) {
      // Bind audio output to the audio element
      meetingSession.audioVideo.bindAudioElement(audioElementRef.current);
    }
  }, [meetingSession]);

  useEffect(() => {
    const muteUnmutecallback = (localMuted) => {
      setIsMuted(localMuted);
    };
    if (!meetingSession) return;
    meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      attendeePrescenceHandler
    );
    meetingSession.audioVideo?.realtimeSubscribeToMuteAndUnmuteLocalAudio(
      muteUnmutecallback
    );
    setIsMuted(meetingSession.audioVideo?.realtimeIsLocalAudioMuted() || false);

    return () => {
      if (meetingSession) {
        meetingSession.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(
          attendeePrescenceHandler
        );
        meetingSession.audioVideo?.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(
          muteUnmutecallback
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingSession]);

  // Effect to bind video tiles to HTML video elements
  // useEffect(() => {
  //   console.log({ videoTiles });

  //   // console.log({ videoTiles, localTile });
  //   if (!videoGridRef.current || !meetingSession) return;

  //   // Clear existing content
  //   videoGridRef.current.innerHTML = "";

  //   // Handle remote video tiles
  //   videoTiles.forEach((tile) => {
  //     console.log({ tile });
  //     const videoContainer = document.createElement("div");
  //     Object.assign(videoContainer.style, {
  //       backgroundColor: "#3c4043",
  //       borderRadius: "8px",
  //       overflow: "hidden",
  //       aspectRatio: "16/9",
  //     });

  //     const videoElement = document.createElement("video");
  //     videoElement.setAttribute("playsinline", true);
  //     Object.assign(videoElement.style, {
  //       width: "100%",
  //       height: "100%",
  //       objectFit: "cover",
  //       display: "none",
  //     });

  //     videoContainer.appendChild(videoElement);
  //     videoGridRef.current.appendChild(videoContainer);

  //     videoElement.addEventListener("loadeddata", () => {
  //       videoElement.style.display = "block";
  //       // setIsLoading(false);
  //     });

  //     meetingSession.audioVideo.bindVideoElement(tile.tileId, videoElement);
  //   });

  //   // Cleanup function
  // }, [videoTiles, meetingSession]);

  // --- UI ---
  if (error) {
    return (
      <>
        <div className=" w-full  text-foreground flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive/50 shadow-lg">
            <CardHeader className="bg-destructive/5 border-b border-destructive/20">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <IoAlertCircleSharp />
                Connection Error
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-6 text-muted-foreground">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    console.log(
                      getRouteWithParams(ROUTES.COURSE_DETAIL, {
                        courseId,
                      })
                    );

                    navigate(
                      getRouteWithParams(ROUTES.COURSE_DETAIL, {
                        courseId,
                      })
                    );
                  }}
                  className="flex-1"
                >
                  View Course
                </Button>
                <Button
                  variant="outline"
                  onClick={joinMeetingHandler}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {meetingId && (
            <Badge variant="outline" className="text-xs px-3 py-1">
              Meeting ID: {meetingId}
            </Badge>
          )}
          <span className="text-muted-foreground text-xs ml-2">
            Class: {courseId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </header>

      {/* Video Grid */}
      <main className="pt-20 pb-32 px-2 md:px-8">
        <Card className="w-full max-w-6xl mx-auto bg-card/80 shadow-lg border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FaVideo className="text-primary" />
              Live Meeting
            </CardTitle>
            {isLoading && (
              <Badge variant="secondary" className="animate-pulse">
                Connecting…
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {/* <div
              ref={videoGridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[40vh]"
            > */}
            {/* Render remote video tiles here dynamically */}
            {/* </div> */}
            <div
              className="video-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
                minHeight: "40vh",
              }}
            >
              {videoTiles.map((tile) => (
                <>
                  <VideoTile
                    key={tile.tileId}
                    tileState={tile}
                    meetingSession={meetingSession}
                    isVideoOff={!roster.get(tile.boundAttendeeId)?.videoEnabled}
                    isMuted={roster.get(tile.boundAttendeeId)?.muted ?? false}
                  />
                </>
              ))}
            </div>
            {/* Local video preview */}
            <div className="fixed bottom-32 right-8 w-56 max-w-xs aspect-video rounded-lg overflow-hidden shadow-lg z-20 bg-muted border border-border">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* <span className="absolute bottom-2 left-2 bg-background/80 text-xs px-2 py-0.5 rounded">
                You
              </span> */}
              <div className="absolute bottom-2 left-2 bg-background/80 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                <span>You</span>
                {isMuted && (
                  <FaMicrophoneSlash className="text-destructive" size={12} />
                )}
              </div>

              {/* Video off indicator - fun animation */}
              {isVideoOff && (
                <div className="absolute inset-0 bg-card flex items-center justify-center">
                  <div className="bg-primary rounded-full h-15 w-15 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-card/95 px-6 py-3 rounded-2xl shadow-lg z-30 border border-border">
        <Button
          variant={isMuted ? "outline" : "default"}
          size="icon"
          onClick={toggleAudio}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </Button>
        <Button
          variant={isVideoOff ? "outline" : "default"}
          size="icon"
          onClick={toggleVideo}
          aria-label={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={async () => {
            await cleanupMeeting();
            navigate(ROUTES.HOME);
          }}
          disabled={isDeleteMeetingLoading}
          aria-label="Leave meeting"
        >
          {isDeleteMeetingLoading ? (
            <ClipLoader size={20} color="#fff" />
          ) : (
            <MdCallEnd className="text-lg" color="#fff" />
          )}
        </Button>
        {/* Device settings button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Device settings">
              <FaCog />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-4" side="right">
            <SheetHeader>
              <SheetTitle>Device Settings</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              {/* Audio Input Device Selector */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Audio Input
                </label>
                <Select
                  value={selectedAudioInput?.deviceId}
                  onValueChange={async (deviceId) => {
                    setSelectedAudioInput(
                      audioInputDevices.find(
                        (device) => device.deviceId === deviceId
                      )
                    );
                    if (meetingSession) {
                      await meetingSession.audioVideo.startAudioInput(deviceId);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an audio input device" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioInputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Output Device Selector */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Audio Output
                </label>
                <Select
                  value={selectedAudioOutput?.deviceId}
                  onValueChange={async (deviceId) => {
                    const device = audioOutputDevices.find(
                      (device) => device.deviceId === deviceId
                    );
                    setSelectedAudioOutput(device);
                    if (meetingSession && device) {
                      try {
                        await meetingSession.audioVideo.chooseAudioOutput(
                          device.deviceId
                        );
                        // Re-bind the audio element after changing the output device
                        if (audioElementRef.current) {
                          meetingSession.audioVideo.bindAudioElement(
                            audioElementRef.current
                          );
                        }
                      } catch (err) {
                        console.error("Failed to set audio output device", err);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an audio output device" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioOutputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Input Device Selector */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Video Input
                </label>
                <Select
                  value={selectedVideoInput?.deviceId}
                  onValueChange={async (deviceId) => {
                    setSelectedVideoInput(
                      videoInputDevices.find(
                        (device) => device.deviceId === deviceId
                      )
                    );
                    if (meetingSession) {
                      await meetingSession.audioVideo.startVideoInput(deviceId);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a video input device" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoInputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Audio element (hidden) */}
      <audio ref={audioElementRef} style={{ display: "none" }} />

      {isLoading && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
          <span className="text-xl font-semibold text-primary animate-pulse">
            Connecting to meeting…
          </span>
        </div>
      )}
    </div>
  );
};

export default Meet;
