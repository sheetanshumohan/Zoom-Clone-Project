"use client";

import React, { useState } from "react";
import { X, Volume2, Mic, Video, Shield, User, Monitor } from "lucide-react";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  microphones: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
  onSwitchAudioDevice: (deviceId: string) => void;
  onSwitchVideoDevice: (deviceId: string) => void;
  securitySettings: {
    lockMeeting: boolean;
    waitingRoom: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    allowRename: boolean;
    allowUnmute: boolean;
  };
  onToggleSecurity: (key: string) => void;
  selfName: string;
  onRenameSelf: (newName: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  microphones,
  cameras,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  securitySettings,
  onToggleSecurity,
  selfName,
  onRenameSelf,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "video" | "profile" | "security">("audio");
  const [nameInput, setNameInput] = useState(selfName);

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    onRenameSelf(nameInput.trim());
    toast.success("Display name updated successfully.");
  };

  const tabs = [
    { id: "audio", name: "Audio / Mic", icon: Mic },
    { id: "video", name: "Video / Camera", icon: Video },
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security & Rules", icon: Shield },
  ] as const;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[640px] rounded-2xl bg-white shadow-modal text-[#1F1F1F] animate-in zoom-in-95 duration-150 border border-[#E5E5E5] m-4 h-[480px] flex overflow-hidden">
        
        {/* Left Sidebar Tabs */}
        <div className="w-[180px] bg-[#F8F8F8] border-r border-[#E5E5E5] p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-[#747487] uppercase tracking-wider mb-3">Settings</span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-bold transition-all flex items-center gap-2.5 ${
                    active
                      ? "bg-[#0B5CFF] text-white shadow-xs"
                      : "text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-[#747487] font-semibold text-center border-t border-[#E5E5E5] pt-3">
            Zoom Clone v1.2
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F3F3F3] px-6 py-4">
            <h3 className="text-sm font-bold text-[#1F1F1F]">
              {tabs.find((t) => t.id === activeTab)?.name} Settings
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold text-[#1F1F1F]">
            {activeTab === "audio" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-[#747487] uppercase">Microphone Input Device</label>
                  {microphones.length > 0 ? (
                    <select
                      onChange={(e) => onSwitchAudioDevice(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E5E5] p-2.5 bg-white text-xs text-[#1F1F1F]"
                    >
                      {microphones.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="italic text-[#747487]">No microphone hardware found</p>
                  )}
                </div>

                <div className="space-y-2 border-t border-[#F3F3F3] pt-4">
                  <span className="block font-bold text-[10px] text-[#747487] uppercase">Test Speaker & Volume</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toast.info("Playing ringtone test audio...")}
                      className="rounded bg-[#F3F3F3] px-3 py-1.5 hover:bg-[#E5E5E5] transition-all text-xs font-bold"
                    >
                      Test Speaker
                    </button>
                    <div className="flex-1 flex items-center gap-1.5">
                      <Volume2 className="h-4.5 w-4.5 text-[#747487]" />
                      <div className="h-2 flex-1 rounded-full bg-[#E5E5E5] overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-[#22C55E] w-[65%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-[#747487] uppercase">Camera Input Device</label>
                  {cameras.length > 0 ? (
                    <select
                      onChange={(e) => onSwitchVideoDevice(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E5E5] p-2.5 bg-white text-xs text-[#1F1F1F]"
                    >
                      {cameras.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="italic text-[#747487]">No webcam hardware found</p>
                  )}
                </div>

                <div className="border border-[#E5E5E5] rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <span className="text-[10px] text-white/50 italic">Live video feed preview</span>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[10px] text-[#747487] uppercase">Display Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 rounded-lg border border-[#E5E5E5] p-2 bg-white text-xs text-[#1F1F1F]"
                    />
                    <button
                      onClick={handleSaveName}
                      className="rounded-lg bg-[#0B5CFF] text-white px-4 hover:bg-[#0E72ED] font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-[#F3F3F3] pt-4">
                  <div className="h-14 w-14 rounded-full bg-[#0B5CFF] text-white flex items-center justify-center text-lg font-bold">
                    {nameInput.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1F1F1F]">{nameInput}</h4>
                    <p className="text-[10px] text-[#747487]">Local Meeting Participant</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-3">
                <span className="block font-bold text-[10px] text-[#747487] uppercase mb-2">Participant Permissions</span>
                
                {[
                  { key: "lockMeeting", label: "Lock Meeting Session" },
                  { key: "waitingRoom", label: "Enable Waiting Room" },
                  { key: "allowScreenShare", label: "Allow Screen Sharing" },
                  { key: "allowChat", label: "Allow Participant Chat" },
                  { key: "allowRename", label: "Allow Participant Rename" },
                  { key: "allowUnmute", label: "Allow Participant Unmute" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer py-1 border-b border-[#F8F8F8] last:border-b-0 hover:bg-[#FDFDFD]">
                    <span className="text-xs font-semibold text-[#1F1F1F]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(securitySettings as any)[item.key]}
                      onChange={() => onToggleSecurity(item.key)}
                      className="rounded border-[#E5E5E5] text-[#0B5CFF] focus:ring-0 bg-transparent h-4.5 w-4.5 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
