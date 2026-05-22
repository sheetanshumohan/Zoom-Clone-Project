"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Loader2, X } from "lucide-react";

interface DeleteMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteMeetingModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteMeetingModalProps) {
  const [deleting, setDeleting] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset deleting loader state on close or open
  useEffect(() => {
    if (isOpen) {
      setDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[#E5E5E5] m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
          disabled={deleting}
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-lg font-bold text-[#1F1F1F]">Delete this meeting?</h3>
        <p className="text-xs text-[#747487] mt-2 leading-relaxed">
          This action cannot be undone. All invitation links associated with this meeting room will immediately stop working.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-[#E5E5E5] bg-white px-4.5 py-2 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg bg-[#E34040] px-5 py-2 text-xs font-bold text-white hover:bg-[#C93333] transition-all disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>{deleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
