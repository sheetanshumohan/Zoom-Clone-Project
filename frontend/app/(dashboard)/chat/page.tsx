"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Send, Smile, Paperclip, Hash, User, MoreVertical, Phone, Video, Info, Shield, Check } from "lucide-react";
import { toast } from "sonner";

interface ChatItem {
  id: string;
  name: string;
  type: "channel" | "direct";
  avatarColor?: string;
  unreadCount: number;
  status?: "online" | "busy" | "away" | "offline";
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  avatarColor: string;
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatItem[]>([
    { id: "c1", name: "general", type: "channel", unreadCount: 2 },
    { id: "c2", name: "engineering", type: "channel", unreadCount: 0 },
    { id: "c3", name: "design-assets", type: "channel", unreadCount: 0 },
    { id: "d1", name: "Alice Johnson", type: "direct", avatarColor: "#0B5CFF", unreadCount: 0, status: "online" },
    { id: "d2", name: "Bob Smith", type: "direct", avatarColor: "#E34040", unreadCount: 1, status: "busy" },
    { id: "d3", name: "Carol Danvers", type: "direct", avatarColor: "#22C55E", unreadCount: 0, status: "away" },
  ]);

  const [selectedChatId, setSelectedChatId] = useState<string>("c1");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  
  // Local messages indexed by chatId
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    c1: [
      { id: "1", sender: "Alice Johnson", text: "Hey everyone! Welcome to the general channel.", timestamp: "10:12 AM", avatarColor: "#0B5CFF" },
      { id: "2", sender: "Bob Smith", text: "Glad to be here! Working on the new sprint tasks.", timestamp: "10:15 AM", avatarColor: "#E34040" },
    ],
    c2: [
      { id: "1", sender: "Carol Danvers", text: "Did anyone review the PR for WebRTC connection?", timestamp: "Yesterday", avatarColor: "#22C55E" },
      { id: "2", sender: "Eva Long", text: "I looked at it. Merging it right now.", timestamp: "9:30 AM", avatarColor: "#A855F7" },
    ],
    d1: [
      { id: "1", sender: "Alice Johnson", text: "Hi! Can you join the meeting to discuss the layout?", timestamp: "11:00 AM", avatarColor: "#0B5CFF" },
    ],
    d2: [
      { id: "1", sender: "Bob Smith", text: "I sent you the design files over email.", timestamp: "Yesterday", avatarColor: "#E34040" },
    ]
  });

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  
  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];
  const activeMessages = messagesMap[selectedChat.id] || [];

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "You",
      text: inputMessage,
      timestamp: timeString,
      avatarColor: "#4B5563"
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMsg]
    }));

    setInputMessage("");
    toast.success("Message sent");
  };

  const handleCreateChannel = () => {
    const name = prompt("Enter channel name:");
    if (!name) return;
    const cleanName = name.toLowerCase().replace(/\s+/g, "-");
    const newChan: ChatItem = {
      id: `c_${Date.now()}`,
      name: cleanName,
      type: "channel",
      unreadCount: 0
    };
    setChats((prev) => [newChan, ...prev]);
    setSelectedChatId(newChan.id);
    toast.success(`Channel #${cleanName} created!`);
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden">
      {/* Left Sidebar: Channels & DMs */}
      <div className="flex w-[280px] flex-col rounded-xl border border-[#E5E5E5]/50 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F1F1F]">Chat</h2>
          <button
            onClick={handleCreateChannel}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0B5CFF] hover:bg-[#D4E4FF] transition-all"
            title="New Chat / Channel"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#747487]" />
          <input
            type="text"
            placeholder="Search channels, direct..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] py-2 pl-9 pr-4 text-xs text-[#1F1F1F] outline-none focus:border-[#0B5CFF] focus:bg-white transition-all"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Channels */}
          <div>
            <span className="text-[10px] font-bold text-[#747487] uppercase tracking-wider mb-2 block">Channels</span>
            <div className="space-y-0.5">
              {filteredChats
                .filter((c) => c.type === "channel")
                .map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      setChats(prev => prev.map(p => p.id === chat.id ? { ...p, unreadCount: 0 } : p));
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all ${
                      selectedChatId === chat.id ? "bg-[#EBF2FF] text-[#0B5CFF] font-semibold" : "text-[#1F1F1F] hover:bg-[#F3F3F3]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`h-4 w-4 shrink-0 ${selectedChatId === chat.id ? "text-[#0B5CFF]" : "text-[#747487]"}`} />
                      <span className="text-xs truncate">{chat.name}</span>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E34040] px-1 text-[9px] font-bold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <span className="text-[10px] font-bold text-[#747487] uppercase tracking-wider mb-2 block">Direct Messages</span>
            <div className="space-y-0.5">
              {filteredChats
                .filter((c) => c.type === "direct")
                .map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      setChats(prev => prev.map(p => p.id === chat.id ? { ...p, unreadCount: 0 } : p));
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all ${
                      selectedChatId === chat.id ? "bg-[#EBF2FF] text-[#0B5CFF] font-semibold" : "text-[#1F1F1F] hover:bg-[#F3F3F3]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative shrink-0">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-inner"
                          style={{ backgroundColor: chat.avatarColor }}
                        >
                          {chat.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                            chat.status === "online"
                              ? "bg-green-500"
                              : chat.status === "busy"
                              ? "bg-red-500"
                              : chat.status === "away"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <span className="text-xs truncate">{chat.name}</span>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E34040] px-1 text-[9px] font-bold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right chat logs window */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#E5E5E5]/50 bg-white shadow-sm overflow-hidden">
        {/* Info header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <div className="flex items-center gap-3">
            {selectedChat.type === "channel" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F3F3] text-[#747487]">
                <Hash className="h-4.5 w-4.5" />
              </div>
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-inner"
                style={{ backgroundColor: selectedChat.avatarColor }}
              >
                {selectedChat.name.split(" ").map((n) => n[0]).join("")}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F]">
                {selectedChat.type === "channel" ? `#${selectedChat.name}` : selectedChat.name}
              </h3>
              <p className="text-[10px] text-[#747487]">
                {selectedChat.type === "channel" ? "Public Channel" : `Direct chat - ${selectedChat.status}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => toast.info(`Initiating audio call with ${selectedChat.name}...`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              onClick={() => toast.info(`Starting instant video meeting with ${selectedChat.name}...`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
            >
              <Video className="h-4 w-4" />
            </button>
            <div className="h-4 w-[1px] bg-[#E5E5E5] mx-1"></div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all">
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message logs list */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FBFBFB] space-y-4">
          {activeMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shrink-0 shadow-inner"
                style={{ backgroundColor: msg.avatarColor }}
              >
                {msg.sender.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-[#1F1F1F]">{msg.sender}</span>
                  <span className="text-[9px] text-[#747487]">{msg.timestamp}</span>
                </div>
                <div className="mt-1 rounded-r-xl rounded-bl-xl bg-white border border-[#E5E5E5]/40 px-3.5 py-2 text-xs text-[#1F1F1F] inline-block shadow-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {activeMessages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <p className="text-xs text-[#747487]">This is the beginning of your chat history.</p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="border-t border-[#E5E5E5] p-4 bg-white">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-1 focus-within:border-[#0B5CFF] focus-within:bg-white transition-all">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#747487] hover:bg-black/5"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              type="text"
              placeholder={`Message ${selectedChat.type === "channel" ? "#" + selectedChat.name : selectedChat.name}`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-transparent px-2 py-3 text-xs text-[#1F1F1F] outline-none"
            />
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#747487] hover:bg-black/5"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B5CFF] text-white hover:bg-[#0E72ED] disabled:opacity-40 disabled:hover:bg-[#0B5CFF] transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
