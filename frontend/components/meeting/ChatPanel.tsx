"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, X, Paperclip, Smile } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  isSelf: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function ChatPanel({ isOpen, onClose, messages, onSendMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when a message arrives
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleFileShare = () => {
    toast.success("File sharing active: Select a document to upload to the room.");
  };

  if (!isOpen) return null;

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-[#333] bg-[#2D2D2D] text-white animate-in slide-in-from-right duration-200 shrink-0 z-30">
      {/* Panel Header */}
      <div className="flex h-[56px] items-center justify-between border-b border-[#3E3E3E] px-4">
        <span className="font-bold text-sm">Meeting Chat</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {/* Sender and Time */}
            <div className="flex items-baseline gap-2">
              <span
                className={`font-bold ${
                  msg.isSelf ? "text-[#C1C1C1]" : "text-[#0B5CFF]"
                }`}
              >
                {msg.isSelf ? "You" : msg.sender}
              </span>
              <span className="text-[10px] text-[#747487]">{msg.time}</span>
            </div>
            {/* Message Body */}
            <p className="mt-1 text-white bg-white/5 rounded-lg px-3 py-2 inline-block max-w-[240px] break-words">
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form at Bottom */}
      <form onSubmit={handleSend} className="border-t border-[#3E3E3E] p-3 space-y-2">
        {/* Attachment toolbar */}
        <div className="flex gap-2 text-[#747487] px-1">
          <button
            type="button"
            onClick={handleFileShare}
            className="hover:text-white transition-colors"
            title="Share File"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setInputText((prev) => prev + " 😊")}
            className="hover:text-white transition-colors"
            title="Add Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        {/* Text Input Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message here..."
            className="flex-1 rounded-full bg-[#1F1F1F] border border-transparent px-4 py-2 text-xs text-white placeholder-[#747487] outline-none focus:border-[#0B5CFF]"
          />
          <button
            type="submit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B5CFF] text-white hover:bg-[#0E72ED] transition-colors"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
