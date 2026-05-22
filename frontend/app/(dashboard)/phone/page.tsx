"use client";

import React, { useState } from "react";
import { Phone, Delete, Clock, Mail, Search, Play, Volume2, Plus, Shield, UserPlus, Trash } from "lucide-react";
import { toast } from "sonner";

interface CallLog {
  id: string;
  name: string;
  number: string;
  type: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration?: string;
}

interface Voicemail {
  id: string;
  name: string;
  number: string;
  timestamp: string;
  duration: string;
  played: boolean;
}

export default function PhonePage() {
  const [activeTab, setActiveTab] = useState<"keypad" | "history" | "voicemail">("keypad");
  const [dialNumber, setDialNumber] = useState("");
  
  const [callHistory, setCallHistory] = useState<CallLog[]>([
    { id: "1", name: "Alice Johnson", number: "+1 (555) 019-2834", type: "incoming", timestamp: "Today, 11:32 AM", duration: "4m 12s" },
    { id: "2", name: "Bob Smith", number: "+1 (555) 014-9912", type: "outgoing", timestamp: "Today, 9:15 AM", duration: "1m 45s" },
    { id: "3", name: "Unknown", number: "+1 (555) 012-4458", type: "missed", timestamp: "Yesterday, 4:40 PM" },
    { id: "4", name: "Carol Danvers", number: "+1 (555) 015-7782", type: "incoming", timestamp: "Yesterday, 2:10 PM", duration: "12m 04s" },
  ]);

  const [voicemails, setVoicemails] = useState<Voicemail[]>([
    { id: "1", name: "Alice Johnson", number: "+1 (555) 019-2834", timestamp: "May 20, 3:15 PM", duration: "0:45", played: false },
    { id: "2", name: "Unknown", number: "+1 (555) 012-4458", timestamp: "May 18, 10:04 AM", duration: "1:12", played: true },
  ]);

  const handleKeyPress = (val: string) => {
    setDialNumber((prev) => prev + val);
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleClearDial = () => {
    setDialNumber("");
  };

  const handleCall = () => {
    if (!dialNumber.trim()) {
      toast.error("Please enter a valid number or select a contact");
      return;
    }
    toast.success(`Dialing ${dialNumber}...`);
    
    // Add to history
    const log: CallLog = {
      id: Date.now().toString(),
      name: "Outbound Call",
      number: dialNumber,
      type: "outgoing",
      timestamp: "Just now",
      duration: "0s"
    };
    setCallHistory((prev) => [log, ...prev]);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden">
      {/* Left sidebar: Tabs */}
      <div className="flex w-[260px] flex-col rounded-xl border border-[#E5E5E5]/50 bg-white p-4 shadow-sm shrink-0">
        <h2 className="text-lg font-bold text-[#1F1F1F] mb-4">Phone</h2>

        {/* Tab List */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("keypad")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "keypad" ? "bg-[#EBF2FF] text-[#0B5CFF]" : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>Keypad Dialer</span>
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "history" ? "bg-[#EBF2FF] text-[#0B5CFF]" : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Call History</span>
          </button>

          <button
            onClick={() => setActiveTab("voicemail")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "voicemail" ? "bg-[#EBF2FF] text-[#0B5CFF]" : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Voicemails</span>
          </button>
        </div>
      </div>

      {/* Right panel: Active tab content */}
      <div className="flex-1 rounded-xl border border-[#E5E5E5]/50 bg-white p-6 shadow-sm flex flex-col justify-center items-center overflow-y-auto">
        
        {activeTab === "keypad" && (
          <div className="w-full max-w-[320px] flex flex-col items-center">
            {/* Display screen */}
            <div className="relative w-full mb-6">
              <input
                type="text"
                placeholder="Enter phone number"
                value={dialNumber}
                readOnly
                className="w-full rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] px-4 py-4 text-center text-xl font-bold tracking-wider text-[#1F1F1F] outline-none"
              />
              {dialNumber && (
                <button
                  onClick={handleBackspace}
                  className="absolute right-3.5 top-4.5 text-[#747487] hover:text-[#1F1F1F]"
                  title="Backspace"
                >
                  <Delete className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-x-5 gap-y-4 mb-6">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F7F7] text-lg font-bold text-[#1F1F1F] border border-[#E5E5E5]/30 hover:bg-[#EBF2FF] hover:text-[#0B5CFF] hover:border-[#0B5CFF]/20 active:scale-95 transition-all"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Dial Button */}
            <div className="flex gap-4 items-center">
              {dialNumber && (
                <button
                  onClick={handleClearDial}
                  className="rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-xs font-semibold hover:bg-[#F3F3F3]"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                title="Dial"
              >
                <Phone className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="w-full max-w-xl flex flex-col h-full">
            <h3 className="text-sm font-bold text-[#1F1F1F] mb-4">Recent Calls</h3>
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {callHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-[#E5E5E5]/40 bg-[#FBFBFB] p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      log.type === "incoming" ? "bg-green-500/10 text-green-600" :
                      log.type === "outgoing" ? "bg-blue-500/10 text-blue-600" : "bg-red-500/10 text-red-600"
                    }`}>
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1F1F1F]">{log.name}</h4>
                      <p className="text-[10px] text-[#747487] mt-0.5">{log.number} • {log.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#747487] font-semibold">{log.duration || "No Answer"}</span>
                    <button
                      onClick={() => {
                        setDialNumber(log.number);
                        setActiveTab("keypad");
                      }}
                      className="ml-4 rounded-lg bg-[#EBF2FF] hover:bg-[#D4E4FF] p-2 text-[#0B5CFF] inline-block align-middle transition-all"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "voicemail" && (
          <div className="w-full max-w-xl flex flex-col h-full">
            <h3 className="text-sm font-bold text-[#1F1F1F] mb-4">Voicemail Box</h3>
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {voicemails.map((mail) => (
                <div
                  key={mail.id}
                  className="flex items-center justify-between rounded-xl border border-[#E5E5E5]/40 bg-[#FBFBFB] p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        toast.info(`Playing voicemail from ${mail.name}...`);
                        setVoicemails(prev => prev.map(m => m.id === mail.id ? { ...m, played: true } : m));
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF2FF] text-[#0B5CFF] hover:bg-[#D4E4FF] transition-all"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold ${mail.played ? "text-[#747487]" : "text-[#1F1F1F]"}`}>
                        {mail.name} {!mail.played && <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 ml-1.5" />}
                      </h4>
                      <p className="text-[10px] text-[#747487] mt-0.5">{mail.number} • {mail.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#747487] font-semibold">{mail.duration}</span>
                    <button
                      onClick={() => {
                        setVoicemails(prev => prev.filter(m => m.id !== mail.id));
                        toast.success("Voicemail deleted");
                      }}
                      className="rounded-lg hover:bg-red-50 p-2 text-[#747487] hover:text-red-500 transition-all"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {voicemails.length === 0 && (
                <p className="text-xs text-[#747487] py-6 text-center">Voicemail box is empty</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
