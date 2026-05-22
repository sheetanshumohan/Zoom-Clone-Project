"use client";

import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from "lucide-react";

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

interface ParticipantGridProps {
  participants: Participant[];
  myAudioOn: boolean;
  myVideoOn: boolean;
  isScreenSharing: boolean;
  localStream?: MediaStream | null;
  remoteStreams?: Record<string, MediaStream>;
  screenStream?: MediaStream | null;
  mirrorVideo?: boolean;
  showNames?: boolean;
  selfName?: string;
  selfId?: string;
}

export default function ParticipantGrid({
  participants,
  myAudioOn,
  myVideoOn,
  isScreenSharing,
  localStream = null,
  remoteStreams = {},
  screenStream = null,
  mirrorVideo = true,
  showNames = true,
  selfName = "You",
  selfId = "",
}: ParticipantGridProps) {
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("gallery");
  const [audioBlocked, setAudioBlocked] = useState(false);

  const hasVideoTrack = (peerId: string) => {
    const stream = remoteStreams[peerId];
    return !!stream && stream.getVideoTracks().length > 0;
  };

  // Helper to handle video attachment and catch autoplay block
  const handleVideoRef = (el: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (el && stream) {
      const currentTracks = (el.srcObject as MediaStream | null)?.getVideoTracks() || [];
      const streamTracks = stream.getVideoTracks();
      const currentVideoTrackId = currentTracks[0]?.id;
      const streamVideoTrackId = streamTracks[0]?.id;

      if (el.srcObject !== stream || currentVideoTrackId !== streamVideoTrackId) {
        el.srcObject = stream;
        el.play().catch((e) => {
          if (e.name === "NotAllowedError") {
            setAudioBlocked(true);
          }
        });
      }
    }
  };

  // Helper to handle audio attachment and catch autoplay block
  const handleAudioRef = (el: HTMLAudioElement | null, stream: MediaStream | null) => {
    if (el && stream) {
      const currentTracks = (el.srcObject as MediaStream | null)?.getAudioTracks() || [];
      const streamTracks = stream.getAudioTracks();
      const currentAudioTrackId = currentTracks[0]?.id;
      const streamAudioTrackId = streamTracks[0]?.id;

      if (el.srcObject !== stream || currentAudioTrackId !== streamAudioTrackId) {
        el.srcObject = stream;
        el.play().catch((e) => {
          if (e.name === "NotAllowedError") {
            setAudioBlocked(true);
          }
        });
      }
    }
  };

  // The grid displays the other participants (excluding self, who is in PIP)
  const others = selfId
    ? participants.filter((p) => p.id !== selfId)
    : participants.filter((p) => !p.isHost);

  // Active speaker
  const activeSpeaker = participants.find((p) => p.isSpeaking) || others[0] || participants[0];

  // Self object helper
  const selfParticipant = (selfId ? participants.find((p) => p.id === selfId) : null) || participants.find((p) => p.isHost) || {
    name: "John Doe (You)",
    avatarColor: "bg-[#0B5CFF]",
    initials: "JD",
    audioOn: myAudioOn,
    videoOn: myVideoOn,
  };

  const getGridLayoutClass = (count: number) => {
    if (count <= 1) return "grid-cols-1 md:max-w-3xl";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 max-w-6xl";
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4 pb-6">
      {/* Remote Audio Tracks - always render to play audio even if remote video is disabled/hidden */}
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <audio
          key={`audio-${peerId}`}
          ref={(el) => handleAudioRef(el, stream)}
          autoPlay
          playsInline
        />
      ))}

      {/* Autoplay Blocker Overlay */}
      {audioBlocked && (
        <div 
           className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
           onClick={() => {
             document.querySelectorAll("video").forEach((v) => {
               if (v.paused) v.play().catch(() => {});
             });
             document.querySelectorAll("audio").forEach((a) => {
               if (a.paused) a.play().catch(() => {});
             });
             setAudioBlocked(false);
           }}
        >
          <div className="bg-[#1A1A1A] p-8 rounded-2xl flex flex-col items-center gap-4 text-center border border-white/10 shadow-2xl">
            <div className="h-16 w-16 bg-[#0B5CFF] rounded-full flex items-center justify-center animate-bounce">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Click to Join Audio</h2>
              <p className="text-sm text-gray-400">Your browser blocked audio playback. Click anywhere to join.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Switch: Speaker / Gallery Toggle */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 rounded-lg bg-black/60 p-1 border border-white/10 text-xs">
        <button
          onClick={() => setViewMode("gallery")}
          className={`rounded-md px-3 py-1 font-semibold transition-colors ${
            viewMode === "gallery" ? "bg-[#0B5CFF] text-white" : "text-white/60 hover:text-white"
          }`}
        >
          Gallery View
        </button>
        <button
          onClick={() => setViewMode("speaker")}
          className={`rounded-md px-3 py-1 font-semibold transition-colors ${
            viewMode === "speaker" ? "bg-[#0B5CFF] text-white" : "text-white/60 hover:text-white"
          }`}
        >
          Speaker View
        </button>
      </div>

      {/* Screen Share Mode */}
      {isScreenSharing ? (
        <div className="flex h-full w-full flex-col md:flex-row gap-4">
          {/* Main share screen area */}
          <div className="flex-1 rounded-xl bg-[#111] border border-[#333] flex flex-col items-center justify-center relative overflow-hidden">
            {screenStream ? (
              <video
                ref={(el) => {
                  if (el) {
                    if (el.srcObject !== screenStream) {
                      el.srcObject = screenStream;
                    }
                    el.play().catch((err) => {
                      if (err.name === 'NotAllowedError') setAudioBlocked(true);
                    });
                  }
                }}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain bg-black"
              />
            ) : (
              <>
                {/* Animated screen share gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-black to-slate-900/10" />
                <div className="z-10 flex flex-col items-center text-center p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] animate-pulse">
                    <Maximize2 className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">You are sharing your screen</h3>
                  <p className="text-xs text-[#747487] mt-1">Participants can see your browser and actions</p>
                </div>
              </>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] border border-white/10 z-10">
              Desktop Screen (John's Display 1)
            </div>
          </div>

          {/* Side strip with participants */}
          <div className="w-full md:w-[220px] flex flex-row md:flex-col gap-3 overflow-y-auto px-1">
            {others.map((p) => {
              const showVideo = p.videoOn && hasVideoTrack(p.id);
              return (
                <div
                  key={p.id}
                  className={`relative aspect-[4/3] w-full rounded-xl bg-[#2D2D2D] border-2 transition-all flex items-center justify-center overflow-hidden shrink-0 ${
                    p.isSpeaking ? "border-[#0B5CFF] shadow-[0_0_8px_rgba(11,92,255,0.3)]" : "border-transparent"
                  }`}
                >
                  {remoteStreams[p.id] && (
                    <video
                      ref={(el) => handleVideoRef(el, remoteStreams[p.id])}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover ${showVideo ? "" : "hidden"}`}
                    />
                  )}
                  {!showVideo && (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${p.avatarColor}`}>
                      {p.initials}
                    </div>
                  )}
                  {/* Micro indicator */}
                  {showNames && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px]">
                      <span>{p.name}</span>
                      {p.audioOn ? (
                        <Mic className="h-2.5 w-2.5 text-[#22C55E]" />
                      ) : (
                        <MicOff className="h-2.5 w-2.5 text-[#E34040]" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "gallery" ? (
        /* GALLERY VIEW: Equal tiles in grid */
        <div className={`grid w-full gap-4 items-center justify-center ${getGridLayoutClass(others.length)}`}>
          {others.map((p) => {
            const showVideo = p.videoOn && hasVideoTrack(p.id);
            return (
              <div
                key={p.id}
                className={`relative aspect-[16/10] w-full rounded-xl bg-[#2D2D2D] border-2 transition-all flex items-center justify-center overflow-hidden ${
                  p.isSpeaking
                    ? "border-[#0B5CFF] shadow-[0_0_12px_rgba(11,92,255,0.4)]"
                    : "border-transparent"
                }`}
              >
                {remoteStreams[p.id] && (
                  <video
                    ref={(el) => handleVideoRef(el, remoteStreams[p.id])}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${showVideo ? "" : "hidden"}`}
                  />
                )}
                {!showVideo && (
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white relative shadow-md ${p.avatarColor}`}
                  >
                    {p.initials}
                  </div>
                )}

                {/* Bottom Label and Audio Status */}
                {showNames && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-[10px]">
                    <span className="font-semibold">{p.name}</span>
                    {p.audioOn ? (
                      <Mic className="h-3 w-3 text-[#22C55E]" />
                    ) : (
                      <MicOff className="h-3 w-3 text-[#E34040]" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* SPEAKER VIEW: Main active speaker, strip at bottom */
        <div className="flex h-full w-full flex-col gap-4">
          {/* Active Speaker Tile */}
          {(() => {
            const showVideo = activeSpeaker.videoOn && hasVideoTrack(activeSpeaker.id);
            return (
              <div
                className={`flex-1 rounded-xl bg-[#2D2D2D] border-2 transition-all flex items-center justify-center overflow-hidden relative ${
                  activeSpeaker.isSpeaking ? "border-[#0B5CFF]" : "border-transparent"
                }`}
              >
                {remoteStreams[activeSpeaker.id] && (
                  <video
                    ref={(el) => handleVideoRef(el, remoteStreams[activeSpeaker.id])}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${showVideo ? "" : "hidden"}`}
                  />
                )}
                {!showVideo && (
                  <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white ${activeSpeaker.avatarColor}`}>
                    {activeSpeaker.initials}
                  </div>
                )}
                
                {/* Speaker view metadata overlay */}
                {showNames && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded bg-black/60 px-2.5 py-1 text-xs">
                    <span className="font-bold">{activeSpeaker.name} (Speaking)</span>
                    <Mic className="h-3.5 w-3.5 text-[#22C55E]" />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Strip of small tiles */}
          <div className="flex h-24 gap-3 justify-center overflow-x-auto py-1">
            {others
              .filter((p) => p.id !== activeSpeaker.id)
              .map((p) => {
                const showVideo = p.videoOn && hasVideoTrack(p.id);
                return (
                  <div
                    key={p.id}
                    className="relative aspect-[4/3] h-full rounded-lg bg-[#2D2D2D] flex items-center justify-center overflow-hidden border border-white/5 shrink-0"
                  >
                    {remoteStreams[p.id] && (
                      <video
                        ref={(el) => handleVideoRef(el, remoteStreams[p.id])}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover ${showVideo ? "" : "hidden"}`}
                      />
                    )}
                    {!showVideo && (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${p.avatarColor}`}>
                        {p.initials}
                      </div>
                    )}
                    {showNames && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1 py-0.5 text-[8px]">
                        {p.name}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Host Self-View PIP — fixed above control bar */}
      <div className="fixed bottom-24 right-4 z-50 aspect-[4/3] w-[180px] rounded-xl border-2 border-white/80 bg-[#1A1A1A] shadow-2xl overflow-hidden transition-all duration-300 hover:border-white group">
        {/* YOU badge */}
        <div className="absolute top-2 left-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white/90 uppercase tracking-wider">
          You
        </div>

        {myVideoOn && localStream ? (
          <video
            ref={(el) => {
              if (el && el.srcObject !== localStream) {
                el.srcObject = localStream;
              }
            }}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${mirrorVideo ? "scale-x-[-1]" : ""}`}
          />
        ) : myVideoOn ? (
          <div className="relative h-full w-full bg-gradient-to-br from-[#3D3D3D] to-[#1A1A1A]">
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#2D2D2D]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0B5CFF] text-sm font-bold text-white ring-2 ring-white/20">
              {selfParticipant.initials}
            </div>
          </div>
        )}

        {/* Bottom name bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
          {showNames && (
            <span className="text-[9px] font-semibold text-white truncate">{selfName} (You)</span>
          )}
          <span className="ml-auto shrink-0">
            {myAudioOn ? (
              <Mic className="h-2.5 w-2.5 text-[#22C55E]" />
            ) : (
              <MicOff className="h-2.5 w-2.5 text-[#E34040]" />
            )}
          </span>
        </div>
      </div>

    </div>
  );
}
