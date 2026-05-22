"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Video,
  Edit,
  Trash2,
  Copy,
  Check,
  Clock,
  Users,
  ArrowUpDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getUpcomingMeetings, getPreviousMeetings, deleteMeeting, createInstantMeeting } from "@/lib/api";
import { Meeting } from "@/lib/types";
import { formatMeetingId, formatMeetingDateTime, parseApiDateTime, getOrCreatePersonalPmi, getOrCreatePersonalPasscode } from "@/lib/utils";

export default function MeetingsPage() {
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"upcoming" | "previous" | "personal" | "templates">("upcoming");
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  
  // Sort and pagination states for Previous meetings
  const [sortField, setSortField] = useState<keyof Meeting>("startTime");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Dropdown menu state in Previous list
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Personal Room state
  const [profileName, setProfileName] = useState("John Doe");
  const [personalPmi, setPersonalPmi] = useState("123-456-7890");
  const [startingPersonal, setStartingPersonal] = useState(false);
  const [personalPasscode, setPersonalPasscode] = useState("ZOOM2026");

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoom_clone_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) setProfileName(parsed.displayName);
      }
      
      const pmi = getOrCreatePersonalPmi();
      const digits = pmi.replace(/\D/g, "").slice(0, 10).padEnd(10, "0");
      setPersonalPmi(`${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`);

      const passcode = getOrCreatePersonalPasscode();
      setPersonalPasscode(passcode);
    } catch (_) {}
  }, []);

  const handleStartPersonalMeeting = async () => {
    setStartingPersonal(true);
    try {
      const cleanPmi = personalPmi.replace(/\D/g, "");
      const meeting = await createInstantMeeting(
        profileName,
        true,
        true,
        cleanPmi,
        "personal",
        personalPasscode,
        true
      );
      toast.success("Starting personal meeting room...");
      try {
        localStorage.setItem(`meeting_host_${meeting.meetingUuid}`, "true");
      } catch (_) {}
      router.push(`/meeting/room/${meeting.meetingUuid}?name=${encodeURIComponent(profileName)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create personal meeting.");
    } finally {
      setStartingPersonal(false);
    }
  };

  const handleSharePersonalRoom = () => {
    const pmiDigits = personalPmi.replace(/-/g, "");
    const inviteUrl = `${window.location.origin}/meeting/join?meetingId=${pmiDigits}`;
    const shareText = `${profileName} is inviting you to a personal Zoom meeting.\n\nMeeting ID: ${personalPmi}\nPasscode: ${personalPasscode}\nJoin: ${inviteUrl}`;
    navigator.clipboard.writeText(shareText);
    toast.success("Invitation copied to clipboard!");
  };

  // Load meetings matching activeTab
  useEffect(() => {
    let active = true;
    async function loadMeetingsData() {
      if (activeTab !== "upcoming" && activeTab !== "previous") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let data: Meeting[] = [];
        if (activeTab === "upcoming") {
          data = await getUpcomingMeetings();
        } else {
          data = await getPreviousMeetings();
        }
        
        if (active) {
          setMeetings(data);
        }
      } catch (err: any) {
        console.error(`Failed to fetch ${activeTab} meetings:`, err);
        toast.error(`Failed to load ${activeTab} meetings from server.`);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeetingsData();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleCopyId = (rawId: string) => {
    const cleanId = rawId.replace(/-/g, "");
    navigator.clipboard.writeText(cleanId);
    setCopiedId(rawId);
    toast.success(`Meeting ID ${formatMeetingId(rawId)} copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = (inviteLink: string) => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const handleStartMeeting = (meetingUuid: string) => {
    toast.success("Starting meeting room...");
    try {
      localStorage.setItem(`meeting_host_${meetingUuid}`, "true");
    } catch (_) {}
    router.push(`/meeting/room/${meetingUuid}?name=${encodeURIComponent(profileName)}`);
  };

  const handleDeleteMeeting = async (uuid: string, title: string) => {
    try {
      await deleteMeeting(uuid);
      toast.success(`Deleted meeting "${title}"`);
      // Reload current tab
      setLoading(true);
      const data = activeTab === "upcoming" ? await getUpcomingMeetings() : await getPreviousMeetings();
      setMeetings(data);
    } catch (err: any) {
      console.error("Failed to delete meeting:", err);
      toast.error(err.message || "Failed to delete meeting on server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Categorize upcoming meetings by relative date
  const getUpcomingSections = () => {
    const sections: { title: string; items: Meeting[] }[] = [
      { title: "Today", items: [] },
      { title: "Tomorrow", items: [] },
      { title: "This Week", items: [] },
    ];

    const todayStr = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    meetings.forEach((m) => {
      const mDate = parseApiDateTime(m.startTime);
      const mDateStr = mDate.toDateString();

      if (mDateStr === todayStr) {
        sections[0].items.push(m);
      } else if (mDateStr === tomorrowStr) {
        sections[1].items.push(m);
      } else if (mDate <= endOfWeek) {
        sections[2].items.push(m);
      } else {
        sections[2].items.push(m);
      }
    });

    return sections.filter((s) => s.items.length > 0);
  };


  // Sort previous meetings logic
  const handleSort = (field: keyof Meeting) => {
    const isAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(isAsc);
    
    setMeetings((prev) => {
      const sorted = [...prev];
      sorted.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (field === "startTime") {
          return isAsc
            ? parseApiDateTime(a.startTime).getTime() - parseApiDateTime(b.startTime).getTime()
            : parseApiDateTime(b.startTime).getTime() - parseApiDateTime(a.startTime).getTime();
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return isAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
      return sorted;
    });
  };

  // Pagination helper
  const itemsPerPage = 5;
  const paginatedMeetings = meetings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(meetings.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* 1. Header Grid */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E5E5]/50 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">Meetings</h2>
          <p className="text-xs text-[#747487]">Manage your calendar rooms, template forms, and scheduled links.</p>
        </div>
        
        <button
          onClick={() => router.push("/meeting/schedule")}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#0B5CFF] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all shrink-0 w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule a Meeting</span>
        </button>
      </div>

      {/* 2. Tabs Switcher */}
      <div className="flex border-b border-[#E5E5E5] gap-6 text-sm">
        {(["upcoming", "previous", "personal", "templates"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`pb-3.5 font-bold capitalize transition-all border-b-2 ${
              activeTab === tab
                ? "border-[#0B5CFF] text-[#0B5CFF]"
                : "border-transparent text-[#747487] hover:text-[#1F1F1F]"
            }`}
          >
            {tab === "personal" ? "Personal Room" : tab === "templates" ? "Meeting Templates" : `${tab} meetings`}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents Layout */}
      <div className="animate-in fade-in duration-200">
        
        {/* Loading Spinner Skeleton */}
        {loading && (activeTab === "upcoming" || activeTab === "previous") ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-xl bg-white p-5 border border-[#E5E5E5] space-y-3">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-8 w-24 rounded bg-gray-200 ml-auto" />
              </div>
            ))}
          </div>
        ) : activeTab === "upcoming" ? (
          /* UPCOMING TAB */
          meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-white border border-[#E5E5E5] shadow-sm">
              <Calendar className="h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-base font-bold text-[#1F1F1F]">No upcoming meetings</h3>
              <p className="text-xs text-[#747487] mt-1 max-w-[240px]">
                You don't have any scheduled meetings. You can create one now.
              </p>
              <button
                onClick={() => router.push("/meeting/schedule")}
                className="mt-5 rounded-lg border border-[#0B5CFF] bg-white px-4 py-2 text-xs font-bold text-[#0B5CFF] hover:bg-[#0B5CFF] hover:text-white transition-all"
              >
                Schedule Meeting
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {getUpcomingSections().map((section) => (
                <div key={section.title} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#747487] px-1">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {section.items.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="group relative rounded-xl border-l-[4px] border-l-[#0B5CFF] border border-[#E5E5E5] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#0B5CFF]"
                      >
                        {/* Topic */}
                        <h4 className="text-base font-bold text-[#1F1F1F] group-hover:text-[#0B5CFF] transition-colors">
                          <Link href={`/meetings/${meeting.meetingUuid}`} className="hover:underline">
                            {meeting.title}
                          </Link>
                        </h4>
                        
                        {/* Metadata row */}
                        <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-[#747487]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatMeetingDateTime(meeting.startTime)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{meeting.durationMinutes} minutes</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span>{meeting.participantCount} participant{meeting.participantCount !== 1 && "s"}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 font-mono">
                            <span>ID: {formatMeetingId(meeting.meetingId)}</span>
                          </div>
                        </div>

                        {/* Bottom Actions row */}
                        <div className="mt-4 flex items-center justify-between border-t border-[#F3F3F3] pt-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartMeeting(meeting.meetingUuid)}
                              className="rounded-lg bg-[#0B5CFF] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0E72ED] transition-all"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => router.push(`/meeting/schedule?edit=${meeting.meetingUuid}`)}
                              className="rounded-lg p-2 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
                              title="Edit Meeting"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.meetingUuid, meeting.title)}
                              className="rounded-lg p-2 text-[#747487] hover:bg-red-50 hover:text-[#E34040] transition-all"
                              title="Delete Meeting"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleCopyLink(meeting.inviteLink)}
                            className="flex items-center gap-1 text-xs font-bold text-[#0B5CFF] hover:underline px-2 py-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Invitation</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "previous" ? (
          /* PREVIOUS TAB TABLE */
          meetings.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#747487]">No previous meetings found.</div>
          ) : (
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#F8F8F8] border-b border-[#E5E5E5] text-xs font-bold uppercase tracking-wider text-[#747487]">
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-[#1F1F1F]" onClick={() => handleSort("title")}>
                        <div className="flex items-center gap-1">
                          <span>Topic</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3">Meeting ID</th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-[#1F1F1F]" onClick={() => handleSort("startTime")}>
                        <div className="flex items-center gap-1">
                          <span>Start Time</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-[#1F1F1F]" onClick={() => handleSort("durationMinutes")}>
                        <div className="flex items-center gap-1">
                          <span>Duration</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center">Participants</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMeetings.map((meeting, idx) => (
                      <tr
                        key={meeting.id}
                        className={`text-sm border-b border-[#E5E5E5] hover:bg-[#F0F4FF]/50 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                        }`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-[#1F1F1F]">
                          <Link href={`/meetings/${meeting.meetingUuid}`} className="hover:text-[#0B5CFF] hover:underline">
                            {meeting.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-[#747487]">
                          <div className="flex items-center gap-1">
                            <span>{formatMeetingId(meeting.meetingId)}</span>
                            <button
                              onClick={() => handleCopyId(meeting.meetingId)}
                              className="text-[#747487] hover:text-[#0B5CFF]"
                            >
                              {copiedId === meeting.meetingId ? (
                                <Check className="h-3 w-3 text-[#22C55E]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#747487]">{formatMeetingDateTime(meeting.startTime)}</td>
                        <td className="px-4 py-3.5 text-xs text-[#747487]">{meeting.durationMinutes} min</td>
                        <td className="px-4 py-3.5 text-center font-bold text-[#1F1F1F]">{meeting.participantCount}</td>
                        <td className="px-4 py-3.5 text-right relative">
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === meeting.id ? null : meeting.id)}
                            className="p-1.5 rounded hover:bg-white/80 text-[#747487] hover:text-[#1F1F1F]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeDropdownId === meeting.id && (
                            <div className="absolute right-4 top-10 z-40 w-32 rounded-lg bg-white border border-[#E5E5E5] p-1 text-left shadow-lg">
                              <button
                                onClick={() => {
                                  router.push(`/meetings/${meeting.meetingUuid}`);
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full px-2 py-1.5 text-xs hover:bg-[#F3F3F3] rounded text-[#1F1F1F]"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleStartMeeting(meeting.meetingUuid);
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full px-2 py-1.5 text-xs hover:bg-[#F3F3F3] rounded text-[#0B5CFF] font-semibold"
                              >
                                Start
                              </button>
                              <hr className="my-1 border-[#F3F3F3]" />
                              <button
                                onClick={() => {
                                  handleDeleteMeeting(meeting.meetingUuid, meeting.title);
                                  setActiveDropdownId(null);
                                }}
                                className="flex w-full px-2 py-1.5 text-xs hover:bg-red-50 text-[#E34040] rounded"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-[#F3F3F3] pt-4 text-xs select-none">
                <span className="text-[#747487]">
                  Showing Page {currentPage} of {totalPages}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E5E5] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F3F3]"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-7 w-7 rounded border font-bold ${
                        currentPage === i + 1
                          ? "border-[#0B5CFF] bg-[#0B5CFF] text-white"
                          : "border-[#E5E5E5] bg-white text-[#747487] hover:bg-[#F3F3F3]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E5E5] bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F3F3]"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        ) : activeTab === "personal" ? (
          /* PERSONAL ROOM TAB */
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#1F1F1F]">{profileName}'s Personal Meeting Room</h3>
              <p className="text-xs text-[#747487]">This room is permanently allocated for your rapid instant meets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#F3F3F3] pb-5">
              <div className="rounded-xl bg-[#F8F8F8] p-4 text-center">
                <span className="block text-xs text-[#747487] uppercase tracking-wider font-semibold">Personal ID (PMI)</span>
                <span className="mt-1 block text-lg font-mono font-bold text-[#0B5CFF]">{personalPmi}</span>
                <button
                  onClick={() => handleCopyId(personalPmi.replace(/-/g, ""))}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#0B5CFF]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy PMI</span>
                </button>
              </div>

              <div className="rounded-xl bg-[#F8F8F8] p-4 text-center md:col-span-2 flex flex-col justify-between">
                <div>
                  <span className="block text-xs text-[#747487] uppercase tracking-wider font-semibold">Invite URL Link</span>
                  <span className="mt-1.5 block text-xs font-mono font-medium text-[#1F1F1F] truncate">
                    {typeof window !== "undefined" ? `${window.location.origin}/meeting/join?meetingId=${personalPmi.replace(/-/g,"")}` : `http://localhost:3000/meeting/join?meetingId=${personalPmi.replace(/-/g,"")}`}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyLink(`${window.location.origin}/meeting/join?meetingId=${personalPmi.replace(/-/g,"")}`)}
                  className="mt-2.5 w-fit mx-auto inline-flex items-center gap-1 text-xs font-bold text-[#0B5CFF]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Invitation Link</span>
                </button>
              </div>
            </div>

            {/* Room Parameters */}
            <div className="space-y-3.5 text-sm">
              <div className="flex border-b border-[#F8F8F8] pb-2.5">
                <span className="w-40 font-bold text-[#747487]">Host</span>
                <span className="font-semibold text-[#1F1F1F]">{profileName} (You)</span>
              </div>
              <div className="flex border-b border-[#F8F8F8] pb-2.5">
                <span className="w-40 font-bold text-[#747487]">Topic</span>
                <span className="font-semibold text-[#1F1F1F]">{profileName}'s Personal Meeting Room</span>
              </div>
              <div className="flex border-b border-[#F8F8F8] pb-2.5">
                <span className="w-40 font-bold text-[#747487]">Passcode</span>
                <span className="font-semibold text-[#0B5CFF] font-mono tracking-wider">{personalPasscode}</span>
              </div>
              <div className="flex border-b border-[#F8F8F8] pb-2.5">
                <span className="w-40 font-bold text-[#747487]">Waiting Room</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Shield className="h-4 w-4" /> Enabled
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleStartPersonalMeeting}
                disabled={startingPersonal}
                className="flex items-center gap-2 rounded-lg bg-[#0B5CFF] px-5 py-2 text-xs font-bold text-white hover:bg-[#0E72ED] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {startingPersonal ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting...</> : "Start Meeting"}
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="rounded-lg border border-[#E5E5E5] bg-white px-5 py-2 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                Edit
              </button>
              <button
                onClick={handleSharePersonalRoom}
                className="rounded-lg border border-[#E5E5E5] bg-white px-5 py-2 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                Share
              </button>
            </div>
          </div>
        ) : (
          /* TEMPLATES TAB */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Daily Standup Template",
                description: "Duration: 15 minutes, Video On, Passcode Enabled, Waiting Room Disabled.",
                tag: "Quick Sync",
                params: new URLSearchParams({
                  topic: "Daily Standup",
                  duration: "15",
                  hostVideo: "on",
                  participantVideo: "on",
                  passcodeEnabled: "true",
                  passcode: "SYNC2026",
                  waitingRoom: "false",
                }).toString(),
              },
              {
                name: "Client Workshop Template",
                description: "Duration: 60 minutes, Video On, Passcode Enabled, Waiting Room Enabled.",
                tag: "External Workshop",
                params: new URLSearchParams({
                  topic: "Client Workshop",
                  duration: "60",
                  hostVideo: "on",
                  participantVideo: "on",
                  passcodeEnabled: "true",
                  passcode: "WORK2026",
                  waitingRoom: "true",
                }).toString(),
              },
              {
                name: "Team Retrospective Template",
                description: "Duration: 30 minutes, Video On, No Passcode, Waiting Room Disabled.",
                tag: "Internal Review",
                params: new URLSearchParams({
                  topic: "Team Retrospective",
                  duration: "30",
                  hostVideo: "on",
                  participantVideo: "on",
                  passcodeEnabled: "false",
                  waitingRoom: "false",
                }).toString(),
              },
              {
                name: "All-Hands Meeting Template",
                description: "Duration: 90 minutes, Video On, Passcode Enabled, Waiting Room Enabled.",
                tag: "Company Wide",
                params: new URLSearchParams({
                  topic: "All-Hands Meeting",
                  duration: "90",
                  hostVideo: "on",
                  participantVideo: "off",
                  passcodeEnabled: "true",
                  passcode: "ALLHANDS",
                  waitingRoom: "true",
                }).toString(),
              },
            ].map((tpl) => (
              <div
                key={tpl.name}
                className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3 hover:border-[#0B5CFF] hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  toast.success(`Template loaded: ${tpl.name}`);
                  router.push(`/meeting/schedule?${tpl.params}`);
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0B5CFF]" />
                  <h4 className="text-sm font-bold text-[#1F1F1F] group-hover:text-[#0B5CFF] transition-colors">{tpl.name}</h4>
                </div>
                <p className="text-xs text-[#747487]">{tpl.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-[#E8F0FE] text-[#0B5CFF] px-2 py-0.5 rounded-full font-bold uppercase">{tpl.tag}</span>
                  <span className="text-[10px] text-[#0B5CFF] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Use Template
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
import Link from "next/link";
