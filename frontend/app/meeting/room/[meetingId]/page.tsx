"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Shield, Copy, Check, Maximize, Minimize, Key, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import ParticipantGrid from "@/components/meeting/ParticipantGrid";
import ControlBar from "@/components/meeting/ControlBar";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import ChatPanel from "@/components/meeting/ChatPanel";
import LeaveModal from "@/components/meeting/LeaveModal";
import BreakoutRoomsModal from "@/components/meeting/BreakoutRoomsModal";
import PollsModal from "@/components/meeting/PollsModal";
import SettingsModal from "@/components/meeting/SettingsModal";
import { getMeetingById, getParticipants, addParticipant, removeParticipant, toggleParticipantMute, muteAllParticipants, endMeeting, getChatMessages, sendChatMessage, renameParticipant, admitParticipant, updateMeeting, ApiError } from "@/lib/api";
import { parseApiDateTime } from "@/lib/utils";

const createDummyVideoTrack = () => {
  try {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // @ts-ignore
    const stream = canvas.captureStream ? canvas.captureStream(1) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(1) : null;
    return stream ? stream.getVideoTracks()[0] : null;
  } catch (err) {
    console.warn("Failed to create dummy video track:", err);
    return null;
  }
};


interface Participant {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
  isHost: boolean;
  audioOn: boolean;
  videoOn: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  isSelf: boolean;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number; // percentage
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawMeetingUuid = (params.meetingId as string) || "";

  // URL search params config
  const initialName = searchParams.get("name") || "";
  const initialVideo = searchParams.get("video") !== "false";
  const initialAudio = searchParams.get("audio") !== "false";

  // Core User states
  const [myAudioOn, setMyAudioOn] = useState(initialAudio);
  const myAudioOnRef = useRef(initialAudio);
  const [myVideoOn, setMyVideoOn] = useState(initialVideo);
  const myVideoOnRef = useRef(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingTimer, setMeetingTimer] = useState(0);
  const [selfParticipantId, setSelfParticipantId] = useState<number | null>(null);

  // Layout states
  const [activePanel, setActivePanel] = useState<"participants" | "chat" | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("Live Meeting Room");
  const [meetingIdStr, setMeetingIdStr] = useState("");

  // Floating reactions state
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const reactionIdCounter = useRef(0);

  // Dynamic Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Security, Passcode & Waiting Room States
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);
  const [meetingObject, setMeetingObject] = useState<any>(null);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [inWaitingRoom, setInWaitingRoomState] = useState(false);
  const inWaitingRoomRef = useRef(false);
  const setInWaitingRoom = (val: boolean) => {
    setInWaitingRoomState(val);
    inWaitingRoomRef.current = val;
  };
  const [waitingParticipants, setWaitingParticipants] = useState<{ id: string; name: string }[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const joinMeetingRoomRef = useRef<((pwd?: string) => Promise<void>) | null>(null);

  // Database Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // User settings preferences loaded from localStorage
  const [confirmOnLeave, setConfirmOnLeave] = useState(true);
  const [showDurationPref, setShowDurationPref] = useState(true);
  const [alwaysShowControls, setAlwaysShowControls] = useState(true);
  const [showControlsBar, setShowControlsBar] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [showNames, setShowNames] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoom_clone_general_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.confirmOnLeave !== undefined) setConfirmOnLeave(parsed.confirmOnLeave);
        if (parsed.showDuration !== undefined) setShowDurationPref(parsed.showDuration);
        if (parsed.showControls !== undefined) setAlwaysShowControls(parsed.showControls);
        if (parsed.autoFullscreen) {
          const handleFirstClick = () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => { });
              setIsFullscreen(true);
            }
            window.removeEventListener("click", handleFirstClick);
          };
          window.addEventListener("click", handleFirstClick);
          return () => window.removeEventListener("click", handleFirstClick);
        }
      }

      const storedVideo = localStorage.getItem("zoom_clone_video_settings");
      if (storedVideo) {
        const parsedVideo = JSON.parse(storedVideo);
        if (parsedVideo.mirrorVideo !== undefined) setMirrorVideo(parsedVideo.mirrorVideo);
        if (parsedVideo.showNames !== undefined) setShowNames(parsedVideo.showNames);
      }
    } catch (err) {
      console.error("Failed to load general settings in room:", err);
    }
  }, []);

  useEffect(() => {
    if (alwaysShowControls) {
      setShowControlsBar(true);
      return;
    }

    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControlsBar(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setShowControlsBar(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    hideTimeout = setTimeout(() => {
      setShowControlsBar(false);
    }, 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [alwaysShowControls]);

  // WebRTC and WebSocket Refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const roomMountedRef = useRef(false);

  // Screen sharing & recording refs/states
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [remoteScreenSharingUserId, setRemoteScreenSharingUserId] = useState<string | null>(null);

  const [selfName, setSelfName] = useState(initialName || "You");

  // Resolve name: URL param → localStorage profile → fallback "You"
  useEffect(() => {
    if (initialName) return; // already set from URL
    try {
      const stored = localStorage.getItem("zoom_clone_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) {
          setSelfName(parsed.displayName);
          return;
        }
      }
    } catch (_) { }
    setSelfName("You");
  }, [initialName]);

  const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    lockMeeting: false,
    waitingRoom: true,
    allowScreenShare: false,
    allowChat: true,
    allowRename: true,
    allowUnmute: true,
  });

  useEffect(() => {
    async function getDevices() {
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        setDevices(devList);
      } catch (err) {
        console.warn("Failed to enumerate devices:", err);
      }
    }
    getDevices();
  }, []);

  // Auto screen sharing trigger if joined with share=true parameter
  useEffect(() => {
    if (searchParams.get("share") === "true" && localStream) {
      const startShareTimer = setTimeout(() => {
        if (!isScreenSharing && !screenStreamRef.current) {
          handleToggleScreenShare().catch((err) => {
            console.warn("Auto screen share initiation failed:", err);
          });
        }
      }, 1200);
      return () => clearTimeout(startShareTimer);
    }
  }, [localStream]);

  const handleToggleSecurity = (key: string) => {
    setSecuritySettings((prev: any) => {
      const newVal = !prev[key];
      toast.success(
        `${key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())}: ${newVal ? "Enabled" : "Disabled"}`
      );

      // Persist waiting room status to database
      if (key === "waitingRoom") {
        updateMeeting(rawMeetingUuid, { waitingRoomEnabled: newVal }).catch((err) => {
          console.error("Failed to persist waiting room status:", err);
        });
      }

      // Broadcast security change event via WebSocket
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "security_change",
            data: { key, value: newVal },
          })
        );
      }

      return {
        ...prev,
        [key]: newVal,
      };
    });
  };

  const handleRenameSelf = async (newName: string) => {
    if (!selfParticipantId) return;
    try {
      await renameParticipant(rawMeetingUuid, selfParticipantId, newName);
      setSelfName(newName);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === selfParticipantId.toString()
            ? {
              ...p,
              name: `${newName} (You)`,
              initials: newName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            }
            : p
        )
      );

      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "name_change",
            data: { name: newName },
          })
        );
      }
    } catch (err) {
      console.error("Failed to rename self:", err);
      toast.error("Could not update name on server.");
    }
  };

  // Helper: map DB participants list to UI structure
  const updateParticipantsList = (dbParticipants: any[], selfId: number) => {
    // Separate approved (active) and unapproved (waiting room) participants
    const approvedList = dbParticipants.filter((p) => p.approved !== false);
    const unapprovedList = dbParticipants.filter((p) => p.approved === false);

    const mappedApproved = approvedList.map((p) => ({
      id: p.id.toString(),
      name: p.id === selfId ? `${p.name} (You)` : p.name,
      avatarColor: p.avatarColor || "bg-[#0B5CFF]",
      initials: p.name ? p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "P",
      isHost: p.role === "host",
      audioOn: p.id === selfId ? myAudioOn : !p.isMuted,
      videoOn: p.id === selfId ? myVideoOn : p.videoOn,
      isSpeaking: false,
    }));

    const mappedWaiting = unapprovedList.map((p) => ({
      id: p.id.toString(),
      name: p.name,
    }));

    setParticipants(mappedApproved);
    setWaitingParticipants(mappedWaiting);
  };

  // Helper: create and configure peer connections
  const createPeerConnection = (peerId: string, ws: WebSocket) => {
    if (peerConnections.current[peerId]) {
      return peerConnections.current[peerId];
    }

    console.log(`WebRTC: Creating peer connection for participant: ${peerId}`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peerConnections.current[peerId] = pc;

    // Attach local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Capture incoming tracks
    pc.ontrack = (event) => {
      console.log(`WebRTC: Received remote track from participant ${peerId}`);
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
      }
    };

    // Forward ICE candidates to target peer
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "ice-candidate",
            target_id: peerId,
            data: event.candidate,
          })
        );
      }
    };

    return pc;
  };

  // Initial setup: Fetch Metadata, Setup Media & WebSockets
  useEffect(() => {
    let active = true;
    roomMountedRef.current = true;

    async function joinMeetingRoom(suppliedPasscode?: string) {
      try {
        setLoadingDetails(true);
        // 1. Fetch meeting details
        const m = await getMeetingById(rawMeetingUuid);
        if (!active) return;
        setMeetingObject(m);

        // If the URL contains the 10-digit ID instead of the UUID, canonicalize to UUID
        if (rawMeetingUuid !== m.meetingUuid) {
          router.replace(`/meeting/room/${m.meetingUuid}${window.location.search}`);
          return;
        }

        setMeetingTitle(m.title);
        setMeetingIdStr(m.meetingId);

        // Populate initial security settings from DB
        setSecuritySettings({
          lockMeeting: (m.status as string) === "locked",
          waitingRoom: m.waitingRoomEnabled,
          allowScreenShare: false,
          allowChat: true,
          allowRename: true,
          allowUnmute: true,
        });

        // 2. Add self to meeting DB with error handling for ended meetings
        let resolvedName = initialName.trim();
        if (!resolvedName) {
          try {
            const stored = localStorage.getItem("zoom_clone_profile");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.displayName) {
                resolvedName = parsed.displayName.trim();
              }
            }
          } catch (_) {}
        }
        if (!resolvedName) {
          resolvedName = "Participant";
        }
        setSelfName(resolvedName);
        const isHost = m.hostName === resolvedName && typeof window !== "undefined" && localStorage.getItem(`meeting_host_${rawMeetingUuid}`) === "true";

        // Check Passcode
        const urlPwd = searchParams.get("pwd") || suppliedPasscode;
        if (m.meetingType !== "instant" && m.passcode && !isHost && urlPwd !== m.passcode) {
          setIsPasscodeRequired(true);
          setLoadingDetails(false);
          if (suppliedPasscode) {
            setPasscodeError("Invalid passcode. Please try again.");
          }
          return;
        }

        // Passcode matches! Clear error and close modal
        setIsPasscodeRequired(false);
        setPasscodeError("");

        let selfRole = isHost ? "host" : "participant";
        
        // Determine default video setting using meeting configurations
        let finalVideoOn = initialVideo;
        if (!searchParams.has("video")) {
          finalVideoOn = isHost ? m.hostVideo : m.participantVideo;
        }
        setMyVideoOn(finalVideoOn);
        myVideoOnRef.current = finalVideoOn;

        let selfP: any;
        try {
          selfP = await addParticipant(rawMeetingUuid, {
            name: resolvedName,
            role: selfRole,
            video_on: finalVideoOn
          });
        } catch (err: any) {
          if (err instanceof ApiError && err.message.toLowerCase().includes("ended")) {
            toast.error("This meeting has ended. Start a new meeting from the dashboard.");
            router.push("/dashboard");
            return;
          }
          console.error("Failed to add participant:", err);
          toast.error("Could not join meeting.");
          setLoadingDetails(false);
          return;
        }
        if (!active) return;
        setSelfParticipantId(selfP.id);

        const shouldBeInWaitingRoom = m.waitingRoomEnabled && !isHost && !selfP.approved;
        if (shouldBeInWaitingRoom) {
          setInWaitingRoom(true);
        } else {
          setInWaitingRoom(false);
        }
        setLoadingDetails(false);

        // Fetch existing database chat messages
        try {
          const dbMessages = await getChatMessages(rawMeetingUuid);
          const mappedMessages = dbMessages.map((msg) => {
            const date = parseApiDateTime(msg.createdAt);
            const timeStr = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            return {
              id: msg.id.toString(),
              sender: msg.sender,
              time: timeStr,
              text: msg.text,
              isSelf: msg.sender === resolvedName,
            };
          });
          setMessages(mappedMessages);
        } catch (chatErr) {
          console.warn("Could not load past chat messages:", chatErr);
        }

        // Helper: Capture local media stream and send status change
        const startLocalMedia = async () => {
          let stream: MediaStream | null = null;
          try {
            if (myVideoOnRef.current) {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
            } else {
              stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true,
              });
              const dummyVideo = createDummyVideoTrack();
              if (dummyVideo) {
                stream.addTrack(dummyVideo);
              }
            }
          } catch (mediaErr) {
            console.warn("Could not capture requested media. Trying fallback...", mediaErr);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              const dummyVideo = createDummyVideoTrack();
              if (dummyVideo) {
                stream.addTrack(dummyVideo);
              }
            } catch (audioErr) {
              try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
              } catch (videoErr) {
                console.warn("All media device requests failed.", videoErr);
              }
            }
          }

          if (stream) {
            stream.getAudioTracks().forEach((track) => {
              track.enabled = initialAudio;
            });
            stream.getVideoTracks().forEach((track) => {
              track.enabled = myVideoOnRef.current;
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            console.log("WebRTC: Captured local media stream successfully.");
          } else {
            toast.error("Entering meeting without active camera/microphone.");
          }

          // Fetch list of participants
          const dbParticipants = await getParticipants(rawMeetingUuid);
          if (!active) return;
          updateParticipantsList(dbParticipants, selfP.id);

          // Broadcast initial status to room
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
              JSON.stringify({
                type: "status_change",
                data: { audioOn: initialAudio, videoOn: myVideoOnRef.current },
              })
            );
          }
        };

        if (!shouldBeInWaitingRoom) {
          await startLocalMedia();
        }

        // 5. Connect to WebSocket signaling server
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL.replace(/^http(s)?:\/\//, "")
          : window.location.host;

        const wsUrl = `${wsProtocol}//${wsHost}/api/meetings/${rawMeetingUuid}/ws/${selfP.id}`;
        console.log("WebSocket: Connecting to server:", wsUrl);
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket: Connected successfully.");
          if (shouldBeInWaitingRoom) {
            ws.send(
              JSON.stringify({
                type: "waiting_room_join",
                data: { name: selfP.name },
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "status_change",
                data: { audioOn: initialAudio, videoOn: myVideoOnRef.current },
              })
            );
          }
        };

        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          const { type, sender_id, data } = msg;
          const senderStr = sender_id?.toString();

          // If this client is currently in the waiting room, ignore all room messages except admit signal and meeting_ended
          if (inWaitingRoomRef.current && type !== "waiting_room_admit" && type !== "meeting_ended") {
            return;
          }

          if (type === "waiting_room_admit") {
            if (data.participant_id === selfP.id) {
              setInWaitingRoom(false);
              await startLocalMedia();
              toast.success("The host has admitted you to the meeting!");
              if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                websocketRef.current.send(
                  JSON.stringify({
                    type: "participant_ready",
                    sender_id: selfP.id,
                  })
                );
              }
            } else {
              // Re-fetch participants list to include the newly admitted participant
              const updatedList = await getParticipants(rawMeetingUuid);
              updateParticipantsList(updatedList, selfP.id);
            }
          }

          else if (type === "waiting_room_join") {
            const updatedList = await getParticipants(rawMeetingUuid);
            updateParticipantsList(updatedList, selfP.id);
            toast.info(`${data.name} is waiting in the waiting room.`);
          }

          else if (type === "security_change") {
            setSecuritySettings((prev: any) => ({
              ...prev,
              [data.key]: data.value,
            }));
            toast.info(
              `Host updated security settings: ${data.key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str: string) => str.toUpperCase())} is now ${data.value ? "Enabled" : "Disabled"}`
            );
          }

          else if (type === "participant_joined" || type === "participant_ready") {
            const updatedList = await getParticipants(rawMeetingUuid);
            updateParticipantsList(updatedList, selfP.id);

            const joinedP = updatedList.find(p => p.id.toString() === senderStr);
            // Only initiate offer if the joined/ready participant is approved
            if (joinedP && joinedP.approved && !inWaitingRoomRef.current) {
              console.log(`WebSocket: Participant ${senderStr} is ready. Initiating offer.`);
              const pc = createPeerConnection(senderStr, ws);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              ws.send(
                JSON.stringify({
                  type: "offer",
                  target_id: senderStr,
                  data: offer,
                })
              );
              if (type === "participant_joined") {
                toast.success(`${joinedP.name} joined the room.`);
              }
            }
          }

          else if (type === "offer") {
            console.log(`WebSocket: Received offer from ${senderStr}. Creating answer.`);
            const pc = createPeerConnection(senderStr, ws);
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            ws.send(
              JSON.stringify({
                type: "answer",
                target_id: senderStr,
                data: answer,
              })
            );
          }

          else if (type === "answer") {
            console.log(`WebSocket: Received answer from ${senderStr}.`);
            const pc = peerConnections.current[senderStr];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(data));
            }
          }

          else if (type === "ice-candidate") {
            const pc = peerConnections.current[senderStr];
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(data));
            }
          }

          else if (type === "participant_left") {
            console.log(`WebSocket: Participant ${senderStr} left.`);
            if (peerConnections.current[senderStr]) {
              peerConnections.current[senderStr].close();
              delete peerConnections.current[senderStr];
            }
            setRemoteStreams((prev) => {
              const updated = { ...prev };
              delete updated[senderStr];
              return updated;
            });
            setParticipants((prev) => prev.filter((p) => p.id !== senderStr));
            toast.info("A participant left the room.");
          }

          else if (type === "status_change") {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === senderStr
                  ? { ...p, audioOn: data.audioOn, videoOn: data.videoOn }
                  : p
              )
            );
          }

          else if (type === "screen_share_change") {
            if (data.isSharing) {
              setRemoteScreenSharingUserId(senderStr);
              toast.info("A participant started screen sharing");
            } else {
              setRemoteScreenSharingUserId(null);
              toast.info("Screen sharing ended");
            }
          }

          else if (type === "name_change") {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === senderStr
                  ? {
                    ...p,
                    name: data.name,
                    initials: data.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase(),
                  }
                  : p
              )
            );
          }

          else if (type === "chat") {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: data.sender,
                time: timeStr,
                text: data.text,
                isSelf: false,
              },
            ]);
            toast.info(`New message from ${data.sender}`);
          }

          else if (type === "reaction") {
            handleSendLocalReaction(data.emoji);
          }

          else if (type === "mute_user") {
            const target = msg.target_id;
            if (target?.toString() === selfP.id.toString()) {
              setMyAudioOn(false);
              myAudioOnRef.current = false;
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                  track.enabled = false;
                });
              }
              toast.warning("You have been muted by the host.");
              ws.send(
                JSON.stringify({
                  type: "status_change",
                  data: { audioOn: false, videoOn: myVideoOnRef.current },
                })
              );
            }
          }

          else if (type === "mute_all") {
            if (selfRole !== "host") {
              setMyAudioOn(false);
              myAudioOnRef.current = false;
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                  track.enabled = false;
                });
              }
              toast.warning("The host has muted everyone.");
              ws.send(
                JSON.stringify({
                  type: "status_change",
                  data: { audioOn: false, videoOn: myVideoOnRef.current },
                })
              );
            }
          }

          else if (type === "kick") {
            const kickTarget = msg.target_id ?? data?.participant_id;
            if (kickTarget === selfP.id) {
              toast.error("You have been removed from the meeting by the host.");
              cleanupAndLeave();
            }
          }

          else if (type === "meeting_ended") {
            toast.error("The host has ended this meeting.");
            cleanupAndLeave();
          }
        };

        ws.onclose = () => {
          console.warn("WebSocket connection closed.");
        };

        if (!shouldBeInWaitingRoom) {
          // Sync initial DB status
          await toggleParticipantMute(rawMeetingUuid, selfP.id, !initialAudio);
        }
      } catch (err: unknown) {
        console.error("Failed to join meeting room:", err);
        if (
          err instanceof ApiError &&
          err.status === 400 &&
          typeof err.message === "string" &&
          err.message.toLowerCase().includes("ended")
        ) {
          toast.error("This meeting has ended. Start a new meeting from the dashboard.");
          router.push("/dashboard");
          return;
        }
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Error connecting to conference session."
        );
      }
    }

    joinMeetingRoomRef.current = joinMeetingRoom;

    if (rawMeetingUuid) {
      joinMeetingRoom();
    }

    return () => {
      active = false;
      roomMountedRef.current = false;
      // Defer cleanup so React Strict Mode remount does not tear down a live socket
      window.setTimeout(() => {
        if (!roomMountedRef.current) {
          cleanupResources();
        }
      }, 0);
    };
  }, [rawMeetingUuid, initialName]);

  // Clean up PeerConnections, MediaTracks and WebSockets
  const cleanupResources = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
  };

  const cleanupAndLeave = () => {
    cleanupResources();
    router.push("/dashboard");
  };

  // Sync Host states with self participant locally
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === selfParticipantId?.toString()
          ? { ...p, audioOn: myAudioOn, videoOn: myVideoOn }
          : p
      )
    );
  }, [myAudioOn, myVideoOn, selfParticipantId]);

  // Active Speaker Simulation Interval (for local indicator)
  useEffect(() => {
    const speakInterval = setInterval(() => {
      setParticipants((prev) => {
        const candidates = prev.filter(p => p.audioOn);
        if (candidates.length === 0) return prev;

        const randIdx = Math.floor(Math.random() * candidates.length);
        const selectedId = candidates[randIdx].id;

        return prev.map(p => ({
          ...p,
          isSpeaking: p.id === selectedId
        }));
      });
    }, 6000);

    return () => clearInterval(speakInterval);
  }, []);

  // Meeting Elapsed Timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setMeetingTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Keep self participant audio/video status in sync in the participants list
  useEffect(() => {
    if (selfParticipantId !== null) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === selfParticipantId.toString()
            ? { ...p, audioOn: myAudioOn, videoOn: myVideoOn }
            : p
        )
      );
    }
  }, [myAudioOn, myVideoOn, selfParticipantId]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error("Fullscreen request denied.");
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCopyMeetingId = () => {
    if (!meetingIdStr) return;
    navigator.clipboard.writeText(meetingIdStr);
    setCopiedId(true);
    toast.success("Meeting ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendMessage = async (text: string) => {
    try {
      const saved = await sendChatMessage(rawMeetingUuid, selfName, text);
      const timeStr = parseApiDateTime(saved.createdAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const newMsg: ChatMessage = {
        id: saved.id.toString(),
        sender: selfName,
        time: timeStr,
        text,
        isSelf: true,
      };

      setMessages(prev => [...prev, newMsg]);

      // Send chat via WebSocket
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "chat",
            data: { text: text, sender: selfName }
          })
        );
      }
    } catch (err) {
      console.error("Failed to save and send chat message:", err);
      toast.error("Could not send chat message.");
    }
  };

  // Toggle Mute Participant via API
  const handleToggleParticipantMute = async (id: string) => {
    const target = participants.find(p => p.id === id);
    if (!target) return;

    try {
      const nextMuteVal = target.audioOn;
      await toggleParticipantMute(rawMeetingUuid, parseInt(id), nextMuteVal);
      setParticipants(prev =>
        prev.map(p => (p.id === id ? { ...p, audioOn: !p.audioOn } : p))
      );

      // If we are muting, send WebSocket command to the specific user
      if (nextMuteVal && websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "mute_user",
            target_id: parseInt(id),
          })
        );
      }

      toast.success(`${target.name} has been ${nextMuteVal ? "muted" : "unmuted"}`);
    } catch (err: any) {
      console.warn("Failed to toggle mute state on backend:", err.message || err);
      toast.error("Could not sync mute action to server.");
    }
  };

  // Mute ALL non-self participants via dedicated bulk API
  const handleMuteAll = async () => {
    const unmutedOthers = participants.filter(
      p => p.id !== selfParticipantId?.toString() && p.audioOn
    );
    if (unmutedOthers.length === 0) {
      toast.info("All participants are already muted.");
      return;
    }

    try {
      const result = await muteAllParticipants(rawMeetingUuid);

      // Optimistically mute everyone except self in UI
      setParticipants(prev =>
        prev.map(p =>
          p.id === selfParticipantId?.toString() ? p : { ...p, audioOn: false }
        )
      );

      // Broadcast mute_all via WebSocket so other clients react
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: "mute_all" }));
      }

      toast.success(`Muted ${result.count} participant${result.count !== 1 ? "s" : ""}.`);
    } catch (err: any) {
      console.warn("Failed to mute all participants:", err.message || err);
      toast.error("Could not mute all participants on server.");
    }
  };

  // Make participant host
  const handleMakeHost = (id: string) => {
    setParticipants(prev =>
      prev.map(p => ({ ...p, isHost: p.id === id }))
    );
    const target = participants.find(p => p.id === id);
    if (target) toast.success(`${target.name} is now the host.`);
  };

  // Duplicate handleRemoveParticipant removed – using later implementation.


  // Copy invite link to clipboard

  // Toggle Audio state for self
  const handleToggleSelfAudio = async () => {
    const nextVal = !myAudioOn;
    setMyAudioOn(nextVal);
    myAudioOnRef.current = nextVal;

    // Toggle tracks locally
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => t.enabled = nextVal);
    }

    if (selfParticipantId) {
      try {
        await toggleParticipantMute(rawMeetingUuid, selfParticipantId, !nextVal);
      } catch (err) {
        console.error("Failed to sync self mute status:", err);
      }
    }

    // Broadcast status change
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(
        JSON.stringify({
          type: "status_change",
          data: { audioOn: nextVal, videoOn: myVideoOnRef.current }
        })
      );
    }
  };

  // Toggle Video state for self
  const handleToggleSelfVideo = async () => {
    const nextVal = !myVideoOn;
    setMyVideoOn(nextVal);
    myVideoOnRef.current = nextVal;

    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const currentTrack = videoTracks[0];

      if (nextVal) {
        // Turning video ON: get real camera track
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = tempStream.getVideoTracks()[0];
          if (newTrack) {
            if (currentTrack) {
              currentTrack.stop(); // Stop the dummy or existing track
              localStreamRef.current.removeTrack(currentTrack);
            }
            localStreamRef.current.addTrack(newTrack);

            // Replace track in peer connections
            Object.values(peerConnections.current).forEach((pc) => {
              const senders = pc.getSenders();
              const sender = senders.find((s) => s.track && s.track.kind === "video");
              if (sender) {
                sender.replaceTrack(newTrack);
              }
            });
          }
        } catch (err: any) {
          console.warn("Failed to acquire camera track:", err.message || err);
          toast.error("Could not access camera.");
          setMyVideoOn(false);
          myVideoOnRef.current = false;
          return;
        }
      } else {
        // Turning video OFF: stop webcam track and substitute with dummy
        if (currentTrack) {
          currentTrack.stop(); // Stops the camera feed/turns webcam light off!
          localStreamRef.current.removeTrack(currentTrack);
        }
        const dummyTrack = createDummyVideoTrack();
        if (dummyTrack) {
          localStreamRef.current.addTrack(dummyTrack);

          // Replace track in peer connections
          Object.values(peerConnections.current).forEach((pc) => {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(dummyTrack);
            }
          });
        }
      }
    }

    // Broadcast status change
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(
        JSON.stringify({
          type: "status_change",
          data: { audioOn: myAudioOnRef.current, videoOn: nextVal },
        })
      );
    }
  };

  // Switch Audio Device input dynamically
  const handleSwitchAudioDevice = async (deviceId: string) => {
    try {
      if (!localStreamRef.current) return;
      const audioTracks = localStreamRef.current.getAudioTracks();
      const oldAudioTrack = audioTracks[0];

      const constraints = {
        audio: { deviceId: { exact: deviceId } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newAudioTrack = newStream.getAudioTracks()[0];

      if (newAudioTrack) {
        newAudioTrack.enabled = myAudioOn;

        if (oldAudioTrack) {
          oldAudioTrack.stop();
          localStreamRef.current.removeTrack(oldAudioTrack);
        }
        localStreamRef.current.addTrack(newAudioTrack);

        // Replace track in peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const senders = pc.getSenders();
          const sender = senders.find((s) => s.track && s.track.kind === "audio");
          if (sender) {
            sender.replaceTrack(newAudioTrack);
          }
        });
        toast.success("Switched microphone successfully.");
      }
    } catch (err: any) {
      console.warn("Failed to switch audio device:", err.message || err);
      toast.error("Could not switch to selected microphone.");
    }
  };

  // Switch Video Device input dynamically
  const handleSwitchVideoDevice = async (deviceId: string) => {
    try {
      if (!localStreamRef.current) return;
      const videoTracks = localStreamRef.current.getVideoTracks();
      const oldVideoTrack = videoTracks[0];

      const constraints = {
        video: { deviceId: { exact: deviceId } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (newVideoTrack) {
        newVideoTrack.enabled = myVideoOn;

        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);

        // Replace track in peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const senders = pc.getSenders();
          const sender = senders.find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });
        toast.success("Switched camera successfully.");
      }
    } catch (err: any) {
      console.warn("Failed to switch video device:", err.message || err);
      toast.error("Could not switch to selected camera.");
    }
  };

  // Toggle real screen sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);

      // Broadcast screen share stopped
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "screen_share_change",
            data: { isSharing: false },
          })
        );
      }

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          Object.values(peerConnections.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(videoTrack);
          });
        }
      }
      toast.success("Screen sharing stopped");
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Broadcast screen share started
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(
            JSON.stringify({
              type: "screen_share_change",
              data: { isSharing: true },
            })
          );
        }

        const screenTrack = stream.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.onended = () => {
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((track) => track.stop());
              screenStreamRef.current = null;
            }
            setScreenStream(null);
            setIsScreenSharing(false);

            // Broadcast screen share stopped
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
              websocketRef.current.send(
                JSON.stringify({
                  type: "screen_share_change",
                  data: { isSharing: false },
                })
              );
            }

            if (localStreamRef.current) {
              const videoTrack = localStreamRef.current.getVideoTracks()[0];
              if (videoTrack) {
                Object.values(peerConnections.current).forEach((pc) => {
                  const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
                  if (sender) sender.replaceTrack(videoTrack);
                });
              }
            }
            toast.info("Screen sharing ended");
          };

          Object.values(peerConnections.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(screenTrack);
          });
        }
        toast.success("Screen sharing started");
      } catch (err: any) {
        console.warn("Failed to share screen:", err.message || err);
        if (err.name === "NotAllowedError" || err.message?.includes("denied") || err.message?.includes("Permission")) {
          toast.info("Screen sharing cancelled.");
        } else {
          toast.error("Failed to start screen sharing.");
        }
      }
    }
  };

  // Toggle real meeting recording
  const handleToggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      toast.success("Recording stopped");
    } else {
      const streamToRecord = screenStreamRef.current || localStreamRef.current;
      if (!streamToRecord) {
        toast.error("No active stream to record!");
        return;
      }

      try {
        recordedChunksRef.current = [];

        let options = { mimeType: "video/webm; codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm; codecs=vp8" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "" };
        }

        const recorder = new MediaRecorder(streamToRecord, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.style.display = "none";
          a.href = url;
          a.download = `zoom-clone-recording-${meetingTitle.replace(/\s+/g, "-")}-${Date.now()}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("Meeting recording downloaded!");
        };

        mediaRecorderRef.current = recorder;
        recorder.start(1000);
        setIsRecording(true);
        toast.success("Recording started");
      } catch (err) {
        console.error("Failed to start recording:", err);
        toast.error("Failed to initialize video recording.");
      }
    }
  };

  // Remove Participant via API and WebSocket kick
  const handleRemoveParticipant = async (id: string) => {
    const target = participants.find(p => p.id === id);
    if (!target) return;

    try {
      await removeParticipant(rawMeetingUuid, parseInt(id));

      // Send kick command via WebSocket
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({
            type: "kick",
            target_id: parseInt(id)
          })
        );
      }

      setParticipants(prev => prev.filter(p => p.id !== id));
      toast.error(`${target.name} has been removed from the meeting.`);
    } catch (err: any) {
      console.error("Failed to remove participant:", err);
      toast.error("Could not complete participant deletion.");
    }
  };

  // handleMakeHost defined earlier – duplicate removed

  const handleInvite = () => {
    if (!meetingIdStr) return;
    const link = `${window.location.origin}/meeting/join?meetingId=${meetingIdStr}`;
    navigator.clipboard.writeText(link);
    toast.success("Meeting invitation link copied to clipboard!");
  };

  // Duplicate handleMuteAll removed – using bulk API implementation defined earlier

  const handleSendReaction = (emoji: string) => {
    handleSendLocalReaction(emoji);

    // Broadcast reaction to room
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(
        JSON.stringify({
          type: "reaction",
          data: { emoji }
        })
      );
    }
  };

  const handleSendLocalReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: reactionIdCounter.current++,
      emoji,
      left: 10 + Math.random() * 80,
    };

    setReactions(prev => [...prev, newReaction]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  const handleAdmitParticipant = async (id: string) => {
    try {
      await admitParticipant(rawMeetingUuid, Number(id));
      toast.success("Participant admitted successfully.");
    } catch (err: any) {
      console.error("Failed to admit participant:", err);
      toast.error("Could not admit participant.");
    }
  };

  const handleAdmitAll = async () => {
    try {
      for (const wp of waitingParticipants) {
        await admitParticipant(rawMeetingUuid, Number(wp.id));
      }
      toast.success("Admitted all waiting participants.");
    } catch (err: any) {
      console.error("Failed to admit all participants:", err);
      toast.error("Could not admit all participants.");
    }
  };

  // Exit meeting cleanup
  const handleLeaveMeeting = async () => {
    if (selfParticipantId) {
      try {
        await removeParticipant(rawMeetingUuid, selfParticipantId);
      } catch (err: any) {
        console.warn("Cleanup participant error on leave:", err.message || err);
      }
    }
    toast.success("You left the meeting.");
    cleanupAndLeave();
  };

  const handleEndMeetingForAll = async () => {
    // 1. Broadcast meeting_ended via websocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        websocketRef.current.send(
          JSON.stringify({
            type: "meeting_ended",
            sender_id: selfParticipantId,
            data: {},
          })
        );
      } catch (wsErr) {
        console.warn("Failed to send meeting_ended via WS:", wsErr);
      }
    }

    // 2. Call backend to end the meeting in DB
    try {
      await endMeeting(rawMeetingUuid);
      toast.success("Meeting ended for all participants.");
    } catch (err: any) {
      console.error("Failed to end meeting:", err);
    }
    cleanupAndLeave();
  };

  // Format display helper
  const formattedId = meetingIdStr
    ? meetingIdStr.length === 10
      ? `${meetingIdStr.slice(0, 3)}-${meetingIdStr.slice(3, 6)}-${meetingIdStr.slice(6)}`
      : meetingIdStr
    : "832-456-7890";

  if (isPasscodeRequired) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161616] text-white px-4">
        <div className="w-full max-w-md rounded-2xl bg-[#232323] p-8 border border-white/5 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Key className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white/90">Enter Meeting Passcode</h2>
          <p className="mt-2 text-sm text-white/60">This meeting is passcode protected. Please enter the passcode to join.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const val = (e.currentTarget.elements.namedItem("passcode") as HTMLInputElement).value;
            joinMeetingRoomRef.current?.(val);
          }} className="mt-6">
            <input
              type="password"
              name="passcode"
              placeholder="Passcode"
              autoFocus
              className="w-full rounded-xl bg-[#2d2d2d] px-4 py-3 text-center text-lg font-semibold tracking-wider text-white border border-white/5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/30"
            />
            {passcodeError && (
              <p className="mt-2.5 text-xs font-semibold text-red-500">{passcodeError}</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-xl bg-[#333333] py-3 text-sm font-semibold hover:bg-[#444] transition-all text-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-500 active:bg-blue-700 transition-all text-white shadow-lg shadow-blue-600/15"
              >
                Join Meeting
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (inWaitingRoom) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161616] text-white px-4">
        <div className="w-full max-w-lg rounded-2xl bg-[#232323] p-8 border border-white/5 shadow-2xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 animate-pulse">
            <ShieldAlert className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white/95">Waiting Room</h2>
          <p className="mt-3 text-base text-white/60 leading-relaxed max-w-sm mx-auto">
            Please wait, the meeting host will let you in soon.
          </p>
          
          <div className="mt-8 rounded-xl bg-[#2d2d2d] p-4 text-left border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-sm font-semibold text-white/90">Meeting Details:</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-white/60">
              <div>Topic: <span className="font-medium text-white/85">{meetingTitle || "Scheduled Session"}</span></div>
              <div>Meeting ID: <span className="font-mono text-white/85">{formattedId}</span></div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLeaveMeeting}
              className="rounded-xl bg-[#333] px-6 py-3 text-sm font-semibold hover:bg-red-950/20 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-200 text-white/80"
            >
              Leave Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#161616] text-white">

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatReaction {
          0% {
            transform: translateY(100%) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(80%) scale(1.2);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-500px) scale(0.8);
            opacity: 0;
          }
        }
        .reaction-bubble {
          animation: floatReaction 3s cubic-bezier(0.08, 0.8, 0.5, 1) forwards;
        }
      `}} />

      {/* 1. Meeting Info Bar (top strip) */}
      <div className="flex h-[48px] w-full items-center justify-between bg-black/40 border-b border-white/5 px-4 z-40 select-none">

        {/* Left Side: ID & Copy */}
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#2D2D2D] hover:bg-white/10 cursor-pointer" title={meetingTitle}>
            <Shield className="h-4 w-4 text-[#22C55E]" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="font-semibold text-white/90">Meeting: {meetingTitle}</span>
            <span className="text-white/40">|</span>
            <span className="font-mono font-bold tracking-wider">{formattedId}</span>
            <button
              onClick={handleCopyMeetingId}
              className="text-white/60 hover:text-white transition-colors"
              title="Copy ID"
            >
              {copiedId ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {showDurationPref && (
              <>
                <span className="text-white/40">|</span>
                <span className="font-mono text-white/80" title="Meeting Duration">{formatTimer(meetingTimer)}</span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Recording State & Full Screen */}
        <div className="flex items-center gap-4 text-xs">
          {isRecording && (
            <div className="flex items-center gap-2 rounded-full bg-red-950/20 px-2.5 py-1 border border-red-500/20">
              <span className="h-2 w-2 rounded-full bg-[#E34040] animate-pulse" />
              <span className="font-bold text-white/90">REC</span>
              <span className="font-mono text-white/70">{formatTimer(meetingTimer)}</span>
            </div>
          )}

          <button
            onClick={handleFullscreenToggle}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/10 text-white/80 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* 2. Main Video Panel & Drawer Container (flex-1 sits above control bar, not under it) */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">

        {/* Real and Simulated Video Tiles Container */}
        <ParticipantGrid
          participants={participants}
          myAudioOn={myAudioOn}
          myVideoOn={myVideoOn}
          isScreenSharing={isScreenSharing || !!remoteScreenSharingUserId}
          localStream={localStream}
          remoteStreams={remoteStreams}
          screenStream={isScreenSharing ? screenStream : (remoteScreenSharingUserId ? remoteStreams[remoteScreenSharingUserId] : null)}
          mirrorVideo={mirrorVideo}
          showNames={showNames}
          selfName={selfName}
          selfId={selfParticipantId?.toString() || ""}
        />

        {/* Floating Emojis HUD */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 z-35 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="reaction-bubble absolute bottom-4 text-4xl"
              style={{ left: `${r.left}%` }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Sliding Panel: Participants drawer */}
        <ParticipantsPanel
          isOpen={activePanel === "participants"}
          onClose={() => setActivePanel(null)}
          participants={participants}
          selfParticipantId={selfParticipantId?.toString() || ""}
          isHostUser={participants.find(p => p.id === selfParticipantId?.toString())?.isHost || false}
          onToggleParticipantMute={handleToggleParticipantMute}
          onRemoveParticipant={handleRemoveParticipant}
          onMakeHost={handleMakeHost}
          onInvite={handleInvite}
          onMuteAll={handleMuteAll}
          onToggleSelfAudio={handleToggleSelfAudio}
          onToggleSelfVideo={handleToggleSelfVideo}
          waitingParticipants={waitingParticipants}
          onAdmitParticipant={handleAdmitParticipant}
        />

        {/* Sliding Panel: Chat drawer */}
        <ChatPanel
          isOpen={activePanel === "chat"}
          onClose={() => setActivePanel(null)}
          messages={messages}
          onSendMessage={handleSendMessage}
        />

      </div>

      {/* 3. Bottom Control Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 transform ${showControlsBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
      >
        <ControlBar
          myAudioOn={myAudioOn}
          myVideoOn={myVideoOn}
          onToggleAudio={handleToggleSelfAudio}
          onToggleVideo={handleToggleSelfVideo}
          activePanel={activePanel}
          onTogglePanel={(panel) => setActivePanel(activePanel === panel ? null : panel)}
          participantsCount={participants.length}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          onSendReaction={handleSendReaction}
          onLeaveClick={() => {
            if (!confirmOnLeave) {
              handleLeaveMeeting();
            } else {
              setIsLeaveModalOpen(true);
            }
          }}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleToggleScreenShare}
          onSwitchAudioDevice={handleSwitchAudioDevice}
          onSwitchVideoDevice={handleSwitchVideoDevice}
          onOpenBreakoutRooms={() => setIsBreakoutOpen(true)}
          onOpenPolls={() => setIsPollsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          securitySettings={securitySettings}
          onToggleSecurity={handleToggleSecurity}
        />
      </div>

      {/* Leave Modal */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeave={handleLeaveMeeting}
        onEndForAll={handleEndMeetingForAll}
        isHost={participants.find(p => p.id === selfParticipantId?.toString())?.isHost || false}
      />

      {/* Breakout Rooms Modal */}
      <BreakoutRoomsModal
        isOpen={isBreakoutOpen}
        onClose={() => setIsBreakoutOpen(false)}
        participants={participants}
      />

      {/* Polls Modal */}
      <PollsModal
        isOpen={isPollsOpen}
        onClose={() => setIsPollsOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        microphones={devices.filter((d) => d.kind === "audioinput")}
        cameras={devices.filter((d) => d.kind === "videoinput")}
        onSwitchAudioDevice={handleSwitchAudioDevice}
        onSwitchVideoDevice={handleSwitchVideoDevice}
        securitySettings={securitySettings}
        onToggleSecurity={handleToggleSecurity}
        selfName={selfName}
        onRenameSelf={handleRenameSelf}
      />

    </div>
  );
}
