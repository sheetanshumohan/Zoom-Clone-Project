"use client";

import React, { useState } from "react";
import { X, Search, Mic, MicOff, Video, VideoOff, MoreHorizontal, UserPlus } from "lucide-react";

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

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  selfParticipantId: string;
  isHostUser: boolean;
  onToggleParticipantMute: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onMakeHost: (id: string) => void;
  onInvite: () => void;
  onMuteAll: () => void;
  onToggleSelfAudio: () => void;
  onToggleSelfVideo: () => void;
  waitingParticipants?: { id: string; name: string }[];
  onAdmitParticipant?: (id: string) => void;
}

export default function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  selfParticipantId,
  isHostUser,
  onToggleParticipantMute,
  onRemoveParticipant,
  onMakeHost,
  onInvite,
  onMuteAll,
  onToggleSelfAudio,
  onToggleSelfVideo,
  waitingParticipants = [],
  onAdmitParticipant,
}: ParticipantsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-[#333] bg-[#2D2D2D] text-white animate-in slide-in-from-right duration-200 shrink-0 z-30 relative">
      {/* Header */}
      <div className="flex h-[56px] items-center justify-between border-b border-[#3E3E3E] px-4">
        <span className="font-bold text-sm">Participants ({participants.length})</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#3E3E3E]">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#747487]">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search participants"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-md bg-[#1F1F1F] pl-9 pr-4 text-xs text-white placeholder-[#747487] outline-none border border-transparent focus:border-[#0B5CFF]"
          />
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Waiting Room Section (only visible to Host) */}
        {isHostUser && waitingParticipants && waitingParticipants.length > 0 && (
          <div className="border-b border-[#3E3E3E] pb-2 mb-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-[#747487] uppercase tracking-wider">
              Waiting Room ({waitingParticipants.length})
            </div>
            {waitingParticipants.map((wp) => (
              <div key={wp.id} className="flex items-center justify-between rounded-lg p-2 bg-[#0B5CFF]/5 border border-[#0B5CFF]/10 hover:bg-[#0B5CFF]/10 transition-all text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B5CFF] text-white font-bold text-[10px]">
                    {wp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-white truncate max-w-[110px]" title={wp.name}>{wp.name}</span>
                </div>
                <button
                  onClick={() => onAdmitParticipant?.(wp.id)}
                  className="bg-[#0B5CFF] text-white hover:bg-[#004DE6] px-2.5 py-1 rounded font-bold text-[10px] transition-all"
                >
                  Admit
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredParticipants.map((p) => {
          const isSelf = p.id === selfParticipantId;

          return (
            <div
              key={p.id}
              className="group flex items-center justify-between rounded-lg p-2 hover:bg-white/5 transition-all text-xs"
            >
              {/* Left: Avatar & Name */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white relative ${p.avatarColor}`}
                >
                  {p.initials}
                  {p.isSpeaking && (
                    <span className="absolute -bottom-[2px] -right-[2px] block h-2.5 w-2.5 rounded-full border border-[#2D2D2D] bg-[#22C55E]" />
                  )}
                </div>
                <div className="text-left max-w-[130px] truncate">
                  <span className="font-semibold text-white truncate block">{p.name}</span>
                  {p.isHost && (
                    <span className="text-[9px] bg-[#0B5CFF] text-white px-1.5 py-[1px] rounded-full font-bold uppercase tracking-wider block mt-[2px] w-fit">
                      Host
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Mute/Video Icons & hover menu */}
              <div className="flex items-center gap-1 text-[#747487]">
                {/* Mic Icon button or status indicator */}
                {isSelf ? (
                  <button
                    onClick={onToggleSelfAudio}
                    className="p-1 hover:text-white rounded"
                    title="Mute/Unmute myself"
                  >
                    {p.audioOn ? (
                      <Mic className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : (
                      <MicOff className="h-3.5 w-3.5 text-[#E34040]" />
                    )}
                  </button>
                ) : isHostUser ? (
                  <button
                    onClick={() => onToggleParticipantMute(p.id)}
                    className="p-1 hover:text-white rounded"
                    title={p.audioOn ? "Mute participant" : "Unmute participant"}
                  >
                    {p.audioOn ? (
                      <Mic className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : (
                      <MicOff className="h-3.5 w-3.5 text-[#E34040]" />
                    )}
                  </button>
                ) : (
                  <span className="p-1 cursor-default opacity-85">
                    {p.audioOn ? (
                      <Mic className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : (
                      <MicOff className="h-3.5 w-3.5 text-[#E34040]" />
                    )}
                  </span>
                )}

                {/* Video Icon button or status indicator */}
                {isSelf ? (
                  <button
                    onClick={onToggleSelfVideo}
                    className="p-1 hover:text-white rounded"
                    title="Start/Stop my video"
                  >
                    {p.videoOn ? (
                      <Video className="h-3.5 w-3.5 text-white/60" />
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-[#E34040]" />
                    )}
                  </button>
                ) : (
                  <span className="p-1 cursor-default opacity-85">
                    {p.videoOn ? (
                      <Video className="h-3.5 w-3.5 text-white/60" />
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-[#E34040]" />
                    )}
                  </span>
                )}

                {/* Action Dropdown Menu - Host actions for other users */}
                {!isSelf && isHostUser && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white rounded transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuId === p.id && (
                      <div className="absolute right-0 bottom-full z-40 mb-1 w-32 rounded bg-[#1F1F1F] p-1 shadow-lg border border-[#3E3E3E] text-left">
                        <button
                          onClick={() => {
                            onToggleParticipantMute(p.id);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center px-2 py-1.5 hover:bg-white/10 rounded"
                        >
                          {p.audioOn ? "Mute" : "Unmute"}
                        </button>
                        <button
                          onClick={() => {
                            onMakeHost(p.id);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center px-2 py-1.5 hover:bg-white/10 rounded"
                        >
                          Make Host
                        </button>
                        <button
                          onClick={() => {
                            onRemoveParticipant(p.id);
                            setActiveMenuId(null);
                          }}
                          className="flex w-full items-center px-2 py-1.5 hover:bg-white/10 text-[#E34040] rounded"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Panel Actions */}
      <div className={`border-t border-[#3E3E3E] p-3 ${isHostUser ? "grid grid-cols-2 gap-2" : "flex"}`}>
        <button
          onClick={onInvite}
          className={`flex items-center justify-center gap-1.5 rounded bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/15 transition-all ${!isHostUser ? "w-full" : ""}`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </button>
        {isHostUser && (
          <button
            onClick={onMuteAll}
            className="rounded border border-[#3E3E3E] py-2 text-xs font-bold text-white hover:bg-[#E34040]/10 hover:text-[#E34040] hover:border-[#E34040] transition-all"
          >
            Mute All
          </button>
        )}
      </div>
    </div>
  );
}
