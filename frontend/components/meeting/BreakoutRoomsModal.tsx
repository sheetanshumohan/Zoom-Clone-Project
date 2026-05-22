"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, ShieldAlert, ArrowRight, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Array<{ id: string; name: string }>;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Array<{ id: string; name: string }>;
}

export default function BreakoutRoomsModal({
  isOpen,
  onClose,
  participants,
}: BreakoutRoomsModalProps) {
  const [roomsCount, setRoomsCount] = useState<number>(2);
  const [assignMethod, setAssignMethod] = useState<"automatically" | "manually">("automatically");
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [areRoomsOpen, setAreRoomsOpen] = useState(false);

  if (!isOpen) return null;

  const handleCreateRooms = () => {
    // Generate rooms
    const newRooms: BreakoutRoom[] = Array.from({ length: roomsCount }, (_, i) => ({
      id: `room-${i + 1}`,
      name: `Breakout Room ${i + 1}`,
      participants: [],
    }));

    if (assignMethod === "automatically") {
      // Distribute participants across rooms
      const filtered = participants.filter((p) => !p.name.includes("(You)"));
      filtered.forEach((p, idx) => {
        const roomIdx = idx % roomsCount;
        newRooms[roomIdx].participants.push(p);
      });
    }

    setRooms(newRooms);
    setStep(2);
    toast.success(`${roomsCount} breakout rooms initialized.`);
  };

  const handleAddRoom = () => {
    const nextNum = rooms.length + 1;
    const newRoom: BreakoutRoom = {
      id: `room-${Date.now()}`,
      name: `Breakout Room ${nextNum}`,
      participants: [],
    };
    setRooms([...rooms, newRoom]);
    toast.success("Added new breakout room.");
  };

  const handleDeleteRoom = (id: string) => {
    const targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) return;

    // Put participants back to unassigned if they were inside
    const updatedRooms = rooms.filter((r) => r.id !== id);
    setRooms(updatedRooms);
    toast.info(`Deleted ${targetRoom.name}.`);
  };

  const handleOpenRooms = () => {
    setAreRoomsOpen(true);
    toast.success("All breakout rooms are now open and active!");
  };

  const handleCloseRooms = () => {
    setAreRoomsOpen(false);
    setStep(1);
    setRooms([]);
    toast.info("All breakout rooms closed. Participants returned to main session.");
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[500px] rounded-2xl bg-white p-6 shadow-modal text-[#1F1F1F] animate-in zoom-in-95 duration-150 border border-[#E5E5E5] m-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1F1F1F]">Breakout Rooms</h3>
            <p className="text-xs text-[#747487]">Divide participants into smaller discussion groups</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content area scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-[#747487] uppercase">Number of Rooms</label>
                <select
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E5E5E5] p-2.5 bg-white focus:outline-none focus:border-[#0B5CFF] text-sm text-[#1F1F1F]"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "room" : "rooms"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="font-semibold text-xs text-[#747487] uppercase">Assign Participants</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5E5] hover:bg-[#F8F8F8] cursor-pointer">
                    <input
                      type="radio"
                      name="assignMethod"
                      checked={assignMethod === "automatically"}
                      onChange={() => setAssignMethod("automatically")}
                      className="text-[#0B5CFF] focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <div>
                      <span className="block font-bold text-xs">Assign Automatically</span>
                      <span className="block text-[11px] text-[#747487]">Evenly distribute participants across rooms</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5E5] hover:bg-[#F8F8F8] cursor-pointer">
                    <input
                      type="radio"
                      name="assignMethod"
                      checked={assignMethod === "manually"}
                      onChange={() => setAssignMethod("manually")}
                      className="text-[#0B5CFF] focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <div>
                      <span className="block font-bold text-xs">Assign Manually</span>
                      <span className="block text-[11px] text-[#747487]">Choose which participants go into which rooms</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#747487]">
                  Rooms List ({rooms.length})
                </span>
                {!areRoomsOpen && (
                  <button
                    onClick={handleAddRoom}
                    className="flex items-center gap-1 text-xs font-bold text-[#0B5CFF] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Room
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room.id} className="rounded-xl border border-[#E5E5E5] p-3.5 bg-[#FDFDFD] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1F1F1F]">{room.name}</span>
                      {!areRoomsOpen && (
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-[#747487] hover:text-[#E34040] p-1 transition-all rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-[#747487] pl-1">
                      {room.participants.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {room.participants.map((p) => (
                            <span key={p.id} className="bg-[#F3F3F3] text-[#1F1F1F] px-2 py-0.5 rounded-full font-semibold">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-[11px]">No participants assigned yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 border-t border-[#F3F3F3] pt-4 flex gap-2.5 w-full">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-[#E5E5E5] bg-white h-[44px] text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRooms}
                className="flex-1 rounded-lg bg-[#0B5CFF] h-[44px] text-xs font-bold text-white hover:bg-[#0E72ED] transition-all flex items-center justify-center gap-1.5"
              >
                Create Rooms <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {!areRoomsOpen ? (
                <>
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-[#E5E5E5] bg-white h-[44px] text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
                  >
                    Back / Recreate
                  </button>
                  <button
                    onClick={handleOpenRooms}
                    className="flex-1 rounded-lg bg-[#22C55E] h-[44px] text-xs font-bold text-white hover:bg-[#16A34A] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="h-4 w-4" /> Open All Rooms
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCloseRooms}
                  className="w-full rounded-lg bg-[#E34040] h-[44px] text-xs font-bold text-white hover:bg-[#C93333] transition-all flex items-center justify-center gap-1.5"
                >
                  <Square className="h-4 w-4" /> Close All Rooms
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
