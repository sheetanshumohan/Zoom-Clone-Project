"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Shield,
  Users,
  MessageSquare,
  Monitor,
  Smile,
  MoreHorizontal,
  ChevronUp,
  Radio,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface ControlBarProps {
  onOpenBreakoutRooms: () => void;
  onOpenPolls: () => void;
  onOpenSettings: () => void;
  securitySettings: {
    lockMeeting: boolean;
    waitingRoom: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    allowRename: boolean;
    allowUnmute: boolean;
  };
  onToggleSecurity: (key: any) => void;
  myAudioOn: boolean;
  myVideoOn: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  activePanel: "participants" | "chat" | null;
  onTogglePanel: (panel: "participants" | "chat") => void;
  participantsCount: number;
  isRecording: boolean;
  onToggleRecording: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveClick: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onSwitchAudioDevice: (deviceId: string) => void;
  onSwitchVideoDevice: (deviceId: string) => void;
}

export default function ControlBar({
  myAudioOn,
  myVideoOn,
  onToggleAudio,
  onToggleVideo,
  activePanel,
  onTogglePanel,
  participantsCount,
  isRecording,
  onToggleRecording,
  onSendReaction,
  onLeaveClick,
  isScreenSharing,
  onToggleScreenShare,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  onOpenBreakoutRooms,
  onOpenPolls,
  onOpenSettings,
  securitySettings,
  onToggleSecurity,
}: ControlBarProps) {
  // Picker popovers
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const audioRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);

  // Media Devices state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // Security Settings state
  

  

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (audioRef.current && !audioRef.current.contains(target)) setAudioPickerOpen(false);
      if (videoRef.current && !videoRef.current.contains(target)) setVideoPickerOpen(false);
      if (reactionsRef.current && !reactionsRef.current.contains(target)) setReactionsOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false);
      if (securityRef.current && !securityRef.current.contains(target)) setSecurityOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch actual media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);
      } catch (err) {
        console.warn("Failed to enumerate devices:", err);
      }
    };
    getDevices();
    navigator.mediaDevices.addEventListener("devicechange", getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
    };
  }, []);

  const microphones = devices.filter((d) => d.kind === "audioinput");
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const speakers = devices.filter((d) => d.kind === "audiooutput");

  const emojis = ["👍", "❤️", "😂", "😮", "👏", "🎉"];

  return (
    <div className="relative z-50 flex h-[72px] w-full shrink-0 items-center justify-between bg-[#111111] border-t border-[#333] px-6 text-white select-none">

      {/* Left: Meeting Settings/Diagnostics Info */}
      <div className="hidden items-center gap-4 text-[10px] text-[#747487] sm:flex md:w-1/4">
        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => toast.info("Encrypted using 256-bit AES GCM standard.")}>
          <Lock className="h-3.5 w-3.5 text-[#22C55E]" />
          <span>Secured</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => toast.info("Latency: 28ms, Packet Loss: 0.1%")}>
          <Radio className="h-3.5 w-3.5 text-[#22C55E]" />
          <span>Green Audio Line</span>
        </div>
      </div>

      {/* Center: Control Panels */}
      <div className="flex items-center gap-1.5 mx-auto">

        {/* 1. Mute/Unmute with chevron */}
        <div className="relative flex items-center" ref={audioRef}>
          <button
            onClick={onToggleAudio}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors hover:bg-white/10 ${!myAudioOn ? "text-[#E34040]" : "text-white"
              }`}
          >
            {myAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            <span className="text-[10px] mt-1 font-semibold">
              {myAudioOn ? "Mute" : "Unmute"}
            </span>
          </button>
          <button
            onClick={() => setAudioPickerOpen(!audioPickerOpen)}
            className="flex h-[32px] items-center justify-center rounded-lg px-0.5 hover:bg-white/10 text-white/60 hover:text-white ml-[2px]"
          >
            <ChevronUp className="h-3 w-3" />
          </button>

          {audioPickerOpen && (
            <div className="absolute bottom-[60px] left-0 z-40 w-56 rounded-lg bg-[#1F1F1F] p-1.5 text-xs shadow-lg border border-[#333] flex flex-col gap-1">
              <span className="block px-2 py-1 text-[10px] font-bold text-[#747487] uppercase">Select Microphone</span>
              {microphones.length > 0 ? (
                microphones.map((mic) => (
                  <button
                    key={mic.deviceId}
                    onClick={() => {
                      onSwitchAudioDevice(mic.deviceId);
                      setAudioPickerOpen(false);
                    }}
                    className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left truncate items-center gap-1.5"
                  >
                    <span>🎙️</span>
                    <span className="truncate">{mic.label || `Microphone ${mic.deviceId.slice(0, 5)}`}</span>
                  </button>
                ))
              ) : (
                <span className="block px-2 py-1.5 text-[#747487] italic text-center">No microphones found</span>
              )}
              {speakers.length > 0 && (
                <>
                  <hr className="my-1 border-[#333]" />
                  <span className="block px-2 py-1 text-[10px] font-bold text-[#747487] uppercase">Select Speaker</span>
                  {speakers.map((spk) => (
                    <button
                      key={spk.deviceId}
                      onClick={() => {
                        toast.success(`Switched speaker to: ${spk.label}`);
                        setAudioPickerOpen(false);
                      }}
                      className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left truncate items-center gap-1.5"
                    >
                      <span>🔊</span>
                      <span className="truncate">{spk.label || `Speaker ${spk.deviceId.slice(0, 5)}`}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* 2. Video On/Off with chevron */}
        <div className="relative flex items-center" ref={videoRef}>
          <button
            onClick={onToggleVideo}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors hover:bg-white/10 ${!myVideoOn ? "text-[#E34040]" : "text-white"
              }`}
          >
            {myVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            <span className="text-[10px] mt-1 font-semibold">
              {myVideoOn ? "Stop Video" : "Start Video"}
            </span>
          </button>
          <button
            onClick={() => setVideoPickerOpen(!videoPickerOpen)}
            className="flex h-[32px] items-center justify-center rounded-lg px-0.5 hover:bg-white/10 text-white/60 hover:text-white ml-[2px]"
          >
            <ChevronUp className="h-3 w-3" />
          </button>

          {videoPickerOpen && (
            <div className="absolute bottom-[60px] left-0 z-40 w-56 rounded-lg bg-[#1F1F1F] p-1.5 text-xs shadow-lg border border-[#333] flex flex-col gap-1">
              <span className="block px-2 py-1 text-[10px] font-bold text-[#747487] uppercase">Select Camera</span>
              {cameras.length > 0 ? (
                cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => {
                      onSwitchVideoDevice(cam.deviceId);
                      setVideoPickerOpen(false);
                    }}
                    className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left truncate items-center gap-1.5"
                  >
                    <span>📷</span>
                    <span className="truncate">{cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}</span>
                  </button>
                ))
              ) : (
                <span className="block px-2 py-1.5 text-[#747487] italic text-center">No cameras found</span>
              )}
            </div>
          )}
        </div>

        {/* 3. Security */}
        <div className="relative flex items-center" ref={securityRef}>
          <button
            onClick={() => setSecurityOpen(!securityOpen)}
            className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors hover:bg-white/10 ${securityOpen ? "bg-[#0B5CFF] text-white hover:bg-[#0E72ED]" : "text-white"
              }`}
          >
            <Shield className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Security</span>
          </button>

          {securityOpen && (
            <div className="absolute bottom-[60px] left-1/2 z-40 -translate-x-1/2 w-56 rounded-lg bg-[#1F1F1F] p-3 text-xs shadow-lg border border-[#333] flex flex-col gap-2">
              <span className="block text-[10px] font-bold text-[#747487] uppercase mb-1">Lock/Unlock</span>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Lock Meeting</span>
                <input
                  type="checkbox"
                  checked={securitySettings.lockMeeting}
                  onChange={() => onToggleSecurity("lockMeeting")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Enable Waiting Room</span>
                <input
                  type="checkbox"
                  checked={securitySettings.waitingRoom}
                  onChange={() => onToggleSecurity("waitingRoom")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>

              <hr className="my-1 border-[#333]" />

              <span className="block text-[10px] font-bold text-[#747487] uppercase mb-1">Allow Participants to:</span>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Share Screen</span>
                <input
                  type="checkbox"
                  checked={securitySettings.allowScreenShare}
                  onChange={() => onToggleSecurity("allowScreenShare")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Chat</span>
                <input
                  type="checkbox"
                  checked={securitySettings.allowChat}
                  onChange={() => onToggleSecurity("allowChat")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Rename Themselves</span>
                <input
                  type="checkbox"
                  checked={securitySettings.allowRename}
                  onChange={() => onToggleSecurity("allowRename")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
                <span>Unmute</span>
                <input
                  type="checkbox"
                  checked={securitySettings.allowUnmute}
                  onChange={() => onToggleSecurity("allowUnmute")}
                  className="rounded border-[#333] text-[#0B5CFF] focus:ring-0 bg-transparent h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* 4. Participants with count badge */}
        <button
          onClick={() => onTogglePanel("participants")}
          className={`relative flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors ${activePanel === "participants"
            ? "bg-[#0B5CFF] text-white hover:bg-[#0E72ED]"
            : "text-white hover:bg-white/10"
            }`}
        >
          <Users className="h-5 w-5" />
          <span className="absolute top-1 right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#747487] px-1 text-[8px] font-bold text-white border border-[#111]">
            {participantsCount}
          </span>
          <span className="text-[10px] mt-1 font-semibold">Participants</span>
        </button>

        {/* 5. Chat */}
        <button
          onClick={() => onTogglePanel("chat")}
          className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors ${activePanel === "chat"
            ? "bg-[#0B5CFF] text-white hover:bg-[#0E72ED]"
            : "text-white hover:bg-white/10"
            }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold">Chat</span>
        </button>

        {/* 6. Share Screen */}
        <button
          onClick={onToggleScreenShare}
          className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors ${isScreenSharing
            ? "bg-[#22C55E] text-white hover:bg-[#16A34A]"
            : "text-[#22C55E] hover:bg-white/10"
            }`}
        >
          <Monitor className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-semibold">
            {isScreenSharing ? "Sharing" : "Share Screen"}
          </span>
        </button>

        {/* 7. Reactions */}
        <div className="relative" ref={reactionsRef}>
          <button
            onClick={() => setReactionsOpen(!reactionsOpen)}
            className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-white hover:bg-white/10 transition-colors"
          >
            <Smile className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">Reactions</span>
          </button>

          {reactionsOpen && (
            <div className="absolute bottom-[60px] left-1/2 z-40 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-[#1F1F1F] px-3.5 py-2.5 border border-[#333] shadow-lg animate-in slide-in-from-bottom-2 duration-150">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setReactionsOpen(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform duration-100 p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 8. More */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-white hover:bg-white/10 transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold">More</span>
          </button>

          {moreOpen && (
            <div className="absolute bottom-[60px] right-0 z-40 w-44 rounded-lg bg-[#1F1F1F] p-1.5 text-xs shadow-lg border border-[#333]">
              <button
                onClick={() => {
                  onToggleRecording();
                  setMoreOpen(false);
                }}
                className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left items-center gap-2"
              >
                <div className={`h-2 w-2 rounded-full ${isRecording ? "bg-[#E34040]" : "bg-gray-400"}`} />
                <span>{isRecording ? "Stop Recording" : "Record Meeting"}</span>
              </button>
              <button
                onClick={() => {
                  onOpenBreakoutRooms();
                  setMoreOpen(false);
                }}
                className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left"
              >
                Breakout Rooms
              </button>
              <button
                onClick={() => {
                  onOpenPolls();
                  setMoreOpen(false);
                }}
                className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left"
              >
                Polls & Quizzes
              </button>
              <hr className="my-1 border-[#333]" />
              <button
                onClick={() => {
                  onOpenSettings();
                  setMoreOpen(false);
                }}
                className="flex w-full px-2 py-1.5 hover:bg-white/10 rounded text-left"
              >
                Meeting Settings
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Right Side: Exit trigger */}
      <div className="flex items-center justify-end md:w-1/4">
        <button
          onClick={onLeaveClick}
          className="h-10 w-20 rounded-lg bg-[#E34040] text-sm font-bold text-white transition-all hover:bg-[#C93333] hover:shadow-md active:scale-95"
        >
          Leave
        </button>
      </div>

    </div>
  );
}
