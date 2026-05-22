"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Shield, Video as VideoIcon, Copy, Check, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMeetingById, scheduleMeeting, updateMeeting } from "@/lib/api";
import { parseApiDateTime, getOrCreatePersonalPmi, formatMeetingId } from "@/lib/utils";
import { Meeting } from "@/lib/types";

const scheduleBaseSchema = z.object({
  topic: z
    .string()
    .min(1, "Topic is required")
    .max(200, "Topic cannot exceed 200 characters"),
  description: z.string().max(1000).optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  durationHours: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(0),
  meetingIdType: z.enum(["auto", "pmi"]),
  passcodeEnabled: z.boolean(),
  passcode: z.string().optional(),
  waitingRoom: z.boolean(),
  hostVideo: z.enum(["on", "off"]),
  participantVideo: z.enum(["on", "off"]),
});

const durationRefine = {
  check: (data: { durationHours: number; durationMinutes: number }) =>
    data.durationHours > 0 || data.durationMinutes > 0,
  message: { message: "Duration must be greater than 0", path: ["durationMinutes"] },
};

const futureDateRefine = {
  check: (data: { date: string; time: string }) => {
    if (!data.date || !data.time) return true;
    return new Date(`${data.date}T${data.time}`) > new Date();
  },
  message: { message: "Meeting time must be in the future", path: ["date"] },
};

// New meetings must be scheduled in the future; edits allow existing past times
const scheduleSchema = scheduleBaseSchema
  .refine(durationRefine.check, durationRefine.message)
  .refine(futureDateRefine.check, futureDateRefine.message);

const scheduleEditSchema = scheduleBaseSchema.refine(
  durationRefine.check,
  durationRefine.message
);

type FormValues = z.infer<typeof scheduleBaseSchema>;

function ScheduleMeetingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [saving, setSaving] = useState(false);
  const [passcodeVal, setPasscodeVal] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [personalPmi, setPersonalPmi] = useState("Loading...");

  useEffect(() => {
    setPersonalPmi(getOrCreatePersonalPmi());
  }, []);

  const generatePasscode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Form initialization
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editId ? scheduleEditSchema : scheduleSchema) as any,
    defaultValues: {
      topic: "",
      description: "",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default to tomorrow to satisfy future constraint
      time: "12:00",
      timezone: "Asia/Kolkata (GMT+5:30)",
      durationHours: 1,
      durationMinutes: 0,
      meetingIdType: "auto",
      passcodeEnabled: true,
      passcode: "",
      waitingRoom: false,
      hostVideo: "on",
      participantVideo: "off",
    },
  });

  const topicVal = watch("topic") || "";
  const passcodeEnabled = watch("passcodeEnabled");
  const meetingIdType = watch("meetingIdType");
  const selectedDate = watch("date");
  const selectedTime = watch("time");

  // Handle Passcode input logic
  useEffect(() => {
    if (passcodeEnabled) {
      if (!passcodeVal) {
        const code = generatePasscode();
        setPasscodeVal(code);
        setValue("passcode", code);
      }
    } else {
      setPasscodeVal("");
      setValue("passcode", "");
    }
  }, [passcodeEnabled, setValue, passcodeVal]);

  // Load existing meeting for Edit Mode
  useEffect(() => {
    if (editId) {
      async function loadMeeting() {
        try {
          const item = await getMeetingById(editId as string);
          const d = parseApiDateTime(item.startTime);
          
          setValue("topic", item.title);
          setValue("description", item.description || "");
          setValue("date", d.toISOString().split("T")[0]);
          
          const hoursStr = String(d.getHours()).padStart(2, "0");
          const minsStr = String(d.getMinutes()).padStart(2, "0");
          setValue("time", `${hoursStr}:${minsStr}`);
          
          setValue("durationHours", Math.floor(item.durationMinutes / 60));
          setValue("durationMinutes", item.durationMinutes % 60);
          setValue("meetingIdType", item.meetingType === "personal" ? "pmi" : "auto");
          setValue("passcodeEnabled", !!item.passcode);
          if (item.passcode) {
            setPasscodeVal(item.passcode);
            setValue("passcode", item.passcode);
          }
          setValue("waitingRoom", item.waitingRoomEnabled);
          setValue("hostVideo", item.hostVideo ? "on" : "off");
          setValue("participantVideo", item.participantVideo ? "on" : "off");
        } catch (err) {
          console.error("Failed to load meeting details for editing:", err);
          toast.error("Could not fetch meeting details.");
        }
      }
      loadMeeting();
    }
  }, [editId, setValue]);

  // Prefill form from template query params (when navigated from Templates tab)
  useEffect(() => {
    if (editId) return;
    const topic = searchParams.get("topic");
    const duration = searchParams.get("duration");
    const hostVideo = searchParams.get("hostVideo");
    const participantVideo = searchParams.get("participantVideo");
    const passcodeEnabledParam = searchParams.get("passcodeEnabled");
    const passcode = searchParams.get("passcode");
    const waitingRoom = searchParams.get("waitingRoom");

    if (topic) setValue("topic", topic);
    if (duration) {
      const mins = parseInt(duration, 10);
      setValue("durationHours", Math.floor(mins / 60));
      setValue("durationMinutes", mins % 60);
    }
    if (hostVideo) setValue("hostVideo", hostVideo as "on" | "off");
    if (participantVideo) setValue("participantVideo", participantVideo as "on" | "off");
    if (passcodeEnabledParam !== null) {
      const enabled = passcodeEnabledParam === "true";
      setValue("passcodeEnabled", enabled);
      if (enabled && passcode) {
        setPasscodeVal(passcode);
        setValue("passcode", passcode);
      }
    }
    if (waitingRoom !== null) setValue("waitingRoom", waitingRoom === "true");
  }, [searchParams, editId, setValue]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      if (editId) {
        // Edit mode PATCH request
        const totalDuration = data.durationHours * 60 + data.durationMinutes;
        const meetingDateTime = new Date(`${data.date}T${data.time}`).toISOString();
        
        const updatePayload: Partial<Meeting> = {
          title: data.topic,
          description: data.description || "",
          startTime: meetingDateTime,
          durationMinutes: totalDuration,
          passcode: data.passcodeEnabled ? data.passcode : null,
          waitingRoomEnabled: data.waitingRoom,
          hostVideo: data.hostVideo === "on",
          participantVideo: data.participantVideo === "on"
        };
        
        await updateMeeting(editId as string, updatePayload);
        toast.success("Meeting updated successfully!");
      } else {
        // Create mode POST request
        let hostName = "John Doe";
        try {
          const stored = localStorage.getItem("zoom_clone_profile");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.displayName) {
              hostName = parsed.displayName;
            }
          }
        } catch (err) {}
        
        (data as any).hostName = hostName;
        await scheduleMeeting(data);
        toast.success("Meeting scheduled successfully!");
      }
      
      router.push("/meetings");
    } catch (err: any) {
      console.error("Failed to save scheduled meeting:", err);
      toast.error(err.message || "Failed to schedule meeting on backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDetails = () => {
    const totalDuration = watch("durationHours") * 60 + watch("durationMinutes");
    const mId = meetingIdType === "pmi" ? formatMeetingId(personalPmi) : "Generated on Save";
    const details = `Topic: ${topicVal || "My Zoom Meeting"}\nDate/Time: ${selectedDate} ${selectedTime}\nDuration: ${totalDuration} minutes\nMeeting ID: ${mId}\nPasscode: ${passcodeVal || "None"}\nLink: ${window.location.origin}/meeting/join?meetingId=${mId.replace(/-/g, "")}`;
    
    navigator.clipboard.writeText(details);
    setCopiedLink(true);
    toast.success("Meeting details copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
      <div className="w-full max-w-[680px] rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-md">
        {/* Header Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F3F3F3] text-[#747487] hover:text-[#1F1F1F]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#1F1F1F]">
              {editId ? "Edit Scheduled Meeting" : "Schedule a Meeting"}
            </h2>
            <p className="text-xs text-[#747487]">
              Provide correct parameters below to schedule your conference room.
            </p>
          </div>
        </div>

        {/* Scheduling Form */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="mt-8 space-y-6">
          {/* 1. Topic */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Topic</label>
              <span className="text-[10px] text-[#747487]">{topicVal.length}/200</span>
            </div>
            <input
              type="text"
              maxLength={200}
              placeholder="My Meeting Topic"
              {...register("topic")}
              className={`flex h-11 w-full rounded-lg border px-3 text-sm outline-none transition-all ${
                errors.topic ? "border-[#E34040]" : "border-[#E5E5E5] focus:border-[#0B5CFF]"
              }`}
            />
            {errors.topic && <p className="text-xs text-[#E34040]">{errors.topic.message}</p>}
          </div>

          {/* 2. Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Provide context or instructions for participants..."
              {...register("description")}
              className="w-full rounded-lg border border-[#E5E5E5] p-3 text-sm outline-none focus:border-[#0B5CFF] resize-none"
            />
          </div>

          {/* 3. When - Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Date</label>
              <input
                type="date"
                {...register("date")}
                className="flex h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF]"
              />
              {errors.date && <p className="text-xs text-[#E34040]">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Time</label>
              <input
                type="time"
                {...register("time")}
                className="flex h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF]"
              />
            </div>
          </div>

          {/* Timezone Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Timezone</label>
            <select
              {...register("timezone")}
              className="flex h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
          </div>

          {/* 4. Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Duration</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                {...register("durationHours")}
                className="flex h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer"
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i} hr{i !== 1 && "s"}
                  </option>
                ))}
              </select>
              
              <select
                {...register("durationMinutes")}
                className="flex h-11 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer"
              >
                <option value={0}>00 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
              </select>
            </div>
            {errors.durationMinutes && (
              <p className="text-xs text-[#E34040]">{errors.durationMinutes.message}</p>
            )}
          </div>

          {/* 5. Meeting ID Selection */}
          <div className="space-y-2 border-t border-[#F3F3F3] pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Meeting ID</label>
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="radio"
                  value="auto"
                  {...register("meetingIdType")}
                  className="h-4 w-4 accent-[#0B5CFF]"
                />
                Generate Automatically
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="radio"
                  value="pmi"
                  {...register("meetingIdType")}
                  className="h-4 w-4 accent-[#0B5CFF]"
                />
                Personal Meeting ID ({formatMeetingId(personalPmi)})
              </label>
            </div>
          </div>

          {/* 6. Security Toggles */}
          <div className="space-y-4 border-t border-[#F3F3F3] pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0B5CFF]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Security Options</label>
            </div>

            {/* Passcode toggle */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-[#1F1F1F]">Passcode</span>
                  <p className="text-xs text-[#747487]">Require a password to join this room</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    {...register("passcodeEnabled")}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>

              {passcodeEnabled && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    value={passcodeVal}
                    readOnly
                    className="w-40 rounded-lg border border-[#E5E5E5] bg-[#F8F8F8] h-10 px-3 font-mono font-bold text-center tracking-wider text-[#0B5CFF]"
                  />
                </div>
              )}
            </div>

            {/* Waiting Room toggle */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-[#1F1F1F]">Waiting Room</span>
                <p className="text-xs text-[#747487]">Host must admit participants before joining</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  {...register("waitingRoom")}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>
          </div>

          {/* 7. Video Settings */}
          <div className="space-y-4 border-t border-[#F3F3F3] pt-4">
            <div className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4 text-[#0B5CFF]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Video Options</label>
            </div>

            {/* Host Video Radio */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-[#1F1F1F]">Host Video</span>
                <p className="text-xs text-[#747487]">Initial state when host joins meeting</p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <input type="radio" value="on" {...register("hostVideo")} className="h-3.5 w-3.5 accent-[#0B5CFF]" />
                  On
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <input type="radio" value="off" {...register("hostVideo")} className="h-3.5 w-3.5 accent-[#0B5CFF]" />
                  Off
                </label>
              </div>
            </div>

            {/* Participant Video Radio */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-[#1F1F1F]">Participant Video</span>
                <p className="text-xs text-[#747487]">Initial state when guests connect</p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <input type="radio" value="on" {...register("participantVideo")} className="h-3.5 w-3.5 accent-[#0B5CFF]" />
                  On
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <input type="radio" value="off" {...register("participantVideo")} className="h-3.5 w-3.5 accent-[#0B5CFF]" />
                  Off
                </label>
              </div>
            </div>
          </div>

          {/* 8. Calendar Section */}
          <div className="space-y-3 border-t border-[#F3F3F3] pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Add to Calendar</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => toast.success("Added to Google Calendar!")}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                <span className="font-bold text-[#4285F4]">G</span>
                <span>Google</span>
              </button>
              
              <button
                type="button"
                onClick={() => toast.success("Added to Outlook Calendar!")}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                <CalendarDays className="h-4 w-4 text-[#0078D4]" />
                <span>Outlook</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDetails}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                {copiedLink ? <Check className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4 text-[#0B5CFF]" />}
                <span>Copy Details</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-[#F3F3F3] pt-5">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0B5CFF] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0E72ED] disabled:bg-[#0B5CFF]/70 disabled:cursor-not-allowed min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScheduleMeetingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B5CFF] border-t-transparent" />
      </div>
    }>
      <ScheduleMeetingPageContent />
    </Suspense>
  );
}
