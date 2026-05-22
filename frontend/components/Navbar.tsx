"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  HelpCircle, 
  Bell, 
  Grid, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  X, 
  Keyboard, 
  BookOpen, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<"profile" | "help" | "notifications" | "apps" | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [selectedHelpArticle, setSelectedHelpArticle] = useState<{ id: string; title: string; content: string } | null>(null);
  
  // Contact Support state
  const [contactSubject, setContactSubject] = useState("");
  const [contactCategory, setContactCategory] = useState("technical");
  const [contactDescription, setContactDescription] = useState("");
  
  const helpArticles = [
    {
      id: "trouble-av",
      title: "Troubleshooting Audio & Video",
      content: "If other participants cannot hear or see you:\n\n1. Check browser permissions in the URL bar (make sure Camera and Microphone are allowed).\n2. Ensure your physical camera shutter is open.\n3. Make sure no other application (like Zoom desktop, Teams, or Skype) is currently using your webcam.\n4. Open Settings in the dashboard and test your speaker/microphone levels."
    },
    {
      id: "join-meeting",
      title: "How to Join a Meeting",
      content: "To join a meeting:\n\n1. Paste a valid Meeting ID (10-digit number) or invitation UUID into the Join box on the Home page.\n2. Enter your display name and configure initial video/audio settings.\n3. Click 'Join Meeting'. You will be automatically redirected to the room."
    },
    {
      id: "host-moderation",
      title: "Managing Meeting Participants",
      content: "As the host of the meeting, you have administrative control:\n\n1. Open the Participants panel on the right drawer.\n2. Click the microphone icon next to a participant to mute/unmute them.\n3. Use 'Mute All' at the bottom to silence all active audio feeds.\n4. Click 'Remove' (represented by a kick/delete action) to disconnect a participant from the meeting."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject || !contactDescription) {
      toast.error("Please fill out all fields");
      return;
    }
    toast.success("Support ticket submitted successfully! Reference ID: #" + Math.floor(100000 + Math.random() * 900000));
    setContactSubject("");
    setContactDescription("");
    setShowContactModal(false);
  };

  const menuContainerRef = useRef<HTMLDivElement>(null);

  const [profileName, setProfileName] = useState("John Doe");
  const [profileInitials, setProfileInitials] = useState("JD");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarColor, setAvatarColor] = useState<string>("#0B5CFF");

  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; read: boolean }[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const loadProfile = () => {
      try {
        const stored = localStorage.getItem("zoom_clone_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.displayName) {
            setProfileName(parsed.displayName);
            const initials = parsed.displayName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            setProfileInitials(initials || "U");
          }
          if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
          else setAvatarUrl("");
          if (parsed.avatarColor) setAvatarColor(parsed.avatarColor);
          else setAvatarColor("#0B5CFF");
        }
      } catch (err) {
        console.error("Failed to load profile in Navbar:", err);
      }
    };

    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem("zoom_clone_notifications");
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          const defaultNotifications = [
            { id: 1, text: "Software Engineer Intern is starting at 11:00 AM", time: "Just now", read: false },
            { id: 2, text: "Weekly Standup recording is ready to view", time: "1 hour ago", read: false },
            { id: 3, text: "System maintenance scheduled for Saturday 2:00 AM", time: "1 day ago", read: true },
          ];
          setNotifications(defaultNotifications);
          localStorage.setItem("zoom_clone_notifications", JSON.stringify(defaultNotifications));
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    loadProfile();
    loadNotifications();
    window.addEventListener("profileUpdate", loadProfile);
    return () => {
      window.removeEventListener("profileUpdate", loadProfile);
    };
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    toast.success("Signed out successfully");
    localStorage.removeItem("zoom_user");
    router.push("/settings");
    setActiveDropdown(null);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("zoom_clone_notifications", JSON.stringify(updated));
    toast.success("All notifications marked as read");
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("zoom_clone_notifications", JSON.stringify([]));
    toast.success("Notifications cleared");
  };

  const toggleDropdown = (dropdown: "profile" | "help" | "notifications" | "apps") => {
    setActiveDropdown(prev => (prev === dropdown ? null : dropdown));
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center justify-between border-b border-[#E5E5E5] bg-white px-4">
        {/* Left: Hamburger menu + Zoom Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F1F1F] hover:bg-[#F3F3F3] md:hidden"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0B5CFF]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z"
                  fill="white"
                />
                <path
                  d="M17 9.5L20.5 7.16667C21.0523 6.79848 21.8 7.1942 21.8 7.86016V16.1398C21.8 16.8058 21.0523 17.2015 20.5 16.8333L17 14.5V9.5Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0B5CFF]">
              zoom
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden max-w-[320px] flex-1 items-center md:flex">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#747487]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search"
              className="h-8 w-full rounded-full border border-transparent bg-[#F3F3F3] pl-9 pr-4 text-sm text-[#1F1F1F] placeholder-[#747487] outline-none transition-all focus:border-[#0B5CFF] focus:bg-white"
            />
          </div>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-2" ref={menuContainerRef}>
          
          {/* 1. Support/Help Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown("help")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                activeDropdown === "help" ? "bg-[#F3F3F3] text-[#1F1F1F]" : "text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
              }`}
              title="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {activeDropdown === "help" && (
              <div className="absolute right-0 mt-2 w-[220px] rounded-xl border border-[#E5E5E5] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] mb-1">
                  Support & Help
                </div>
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setActiveDropdown(null);
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#1F1F1F] hover:bg-[#F3F3F3]"
                >
                  <BookOpen className="h-4 w-4 text-[#747487]" />
                  Help Center
                </button>
                <button
                  onClick={() => {
                    setShowShortcuts(true);
                    setActiveDropdown(null);
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#1F1F1F] hover:bg-[#F3F3F3]"
                >
                  <Keyboard className="h-4 w-4 text-[#747487]" />
                  Keyboard Shortcuts
                </button>
                <button
                  onClick={() => {
                    setShowContactModal(true);
                    setActiveDropdown(null);
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#1F1F1F] hover:bg-[#F3F3F3]"
                >
                  <MessageSquare className="h-4 w-4 text-[#747487]" />
                  Contact Support
                </button>
              </div>
            )}
          </div>

          {/* 2. Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown("notifications")}
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                activeDropdown === "notifications" ? "bg-[#F3F3F3] text-[#1F1F1F]" : "text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
              }`}
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#E34040] text-[8px] font-bold text-white ring-2 ring-white" />
              )}
            </button>

            {activeDropdown === "notifications" && (
              <div className="absolute right-0 mt-2 w-[300px] rounded-xl border border-[#E5E5E5] bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#F3F3F3] px-4 py-2.5 bg-[#FAFAFA]">
                  <span className="text-xs font-bold text-[#1F1F1F]">Notifications ({notifications.length})</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-[#0B5CFF] hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-[220px] overflow-y-auto divide-y divide-[#F3F3F3]">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-[#747487]">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-[#F8F8F8] transition-colors ${!n.read ? "bg-[#F0F4FF]/30" : ""}`}>
                        <div className="flex items-start gap-2">
                          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${!n.read ? "bg-[#0B5CFF]" : "bg-transparent"}`} />
                          <div>
                            <p className="text-xs font-medium text-[#1F1F1F] leading-normal">{n.text}</p>
                            <span className="text-[10px] text-[#747487] mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t border-[#F3F3F3] bg-[#FAFAFA] p-2 text-center">
                    <button onClick={clearNotifications} className="text-[10px] font-bold text-[#E34040] hover:underline">
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Apps Grid Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown("apps")}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                activeDropdown === "apps" ? "bg-[#F3F3F3] text-[#1F1F1F]" : "text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
              }`}
              title="Apps"
            >
              <Grid className="h-5 w-5" />
            </button>

            {activeDropdown === "apps" && (
              <div className="absolute right-0 mt-2 w-[260px] rounded-xl border border-[#E5E5E5] bg-white p-3 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="text-xs font-bold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-2 mb-3">
                  Zoom Workspace Apps
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Link 
                    href="/whiteboard" 
                    onClick={() => setActiveDropdown(null)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-[#F3F3F3] text-center transition-colors group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-1 group-hover:scale-105 transition-transform">
                      <Layers className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#1F1F1F]">Whiteboard</span>
                  </Link>

                  <div 
                    onClick={() => { toast.info("Notes feature coming soon!"); setActiveDropdown(null); }}
                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-[#F3F3F3] text-center transition-colors group cursor-pointer"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-1 group-hover:scale-105 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#1F1F1F]">Notes</span>
                  </div>

                  <div 
                    onClick={() => { toast.info("AI Companion active"); setActiveDropdown(null); }}
                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-[#F3F3F3] text-center transition-colors group cursor-pointer"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-1 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#1F1F1F]">Companion</span>
                  </div>
                </div>

                <div className="border-t border-[#F3F3F3] mt-3 pt-2 text-center">
                  <button 
                    onClick={() => { toast.success("Redirecting to Zoom App Marketplace..."); setActiveDropdown(null); }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B5CFF] hover:underline"
                  >
                    <span>App Marketplace</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div className="mx-1 h-6 w-[1px] bg-[#E5E5E5]"></div>

          {/* 4. User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("profile")}
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-transparent transition-all hover:ring-[#E5E5E5] overflow-hidden ${
                activeDropdown === "profile" ? "ring-[#0B5CFF]/30" : ""
              }`}
              style={{ backgroundColor: avatarUrl ? "transparent" : avatarColor }}
              aria-haspopup="true"
              aria-expanded={activeDropdown === "profile"}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                profileInitials
              )}
            </button>

            {activeDropdown === "profile" && (
              <div className="absolute right-0 mt-2 w-[180px] rounded-lg border border-[#E5E5E5] bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-[#747487] border-b border-[#F3F3F3] mb-1 flex items-center gap-2">
                  <div 
                    className="h-6 w-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center overflow-hidden shrink-0"
                    style={{ backgroundColor: avatarUrl ? "transparent" : avatarColor }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      profileInitials
                    )}
                  </div>
                  <span className="truncate max-w-[120px]">{profileName} (Host)</span>
                </div>
                <Link
                  href="/settings?tab=profile"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#1F1F1F] hover:bg-[#F3F3F3]"
                >
                  <User className="h-4 w-4 text-[#747487]" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm text-[#1F1F1F] hover:bg-[#F3F3F3]"
                >
                  <Settings className="h-4 w-4 text-[#747487]" />
                  Settings
                </Link>
                <hr className="my-1 border-[#F3F3F3]" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-[#E34040] hover:bg-[#FDF2F2]"
                >
                  <LogOut className="h-4 w-4 text-[#E34040]" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3.5 mb-4">
              <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-[#0B5CFF]" />
                <span>Keyboard Shortcuts</span>
              </h3>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="rounded-full p-1.5 hover:bg-[#F3F3F3] text-[#747487] hover:text-[#1F1F1F]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-[#F8F8F8]">
                <span className="font-semibold text-[#1F1F1F]">Toggle Audio (Mute/Unmute)</span>
                <kbd className="px-2.5 py-1 rounded bg-[#F3F3F3] font-mono text-xs font-bold text-[#747487] border border-[#E5E5E5]">Alt + A</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#F8F8F8]">
                <span className="font-semibold text-[#1F1F1F]">Toggle Video (Start/Stop)</span>
                <kbd className="px-2.5 py-1 rounded bg-[#F3F3F3] font-mono text-xs font-bold text-[#747487] border border-[#E5E5E5]">Alt + V</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#F8F8F8]">
                <span className="font-semibold text-[#1F1F1F]">Share/Stop Share Screen</span>
                <kbd className="px-2.5 py-1 rounded bg-[#F3F3F3] font-mono text-xs font-bold text-[#747487] border border-[#E5E5E5]">Alt + S</kbd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#F8F8F8]">
                <span className="font-semibold text-[#1F1F1F]">Toggle Chat Drawer</span>
                <kbd className="px-2.5 py-1 rounded bg-[#F3F3F3] font-mono text-xs font-bold text-[#747487] border border-[#E5E5E5]">Alt + H</kbd>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowShortcuts(false)}
                className="rounded-lg bg-[#0B5CFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Center Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3.5 mb-4">
              <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0B5CFF]" />
                <span>Help Center</span>
              </h3>
              <button 
                onClick={() => { setShowHelpModal(false); setSelectedHelpArticle(null); }}
                className="rounded-full p-1.5 hover:bg-[#F3F3F3] text-[#747487] hover:text-[#1F1F1F]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedHelpArticle ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedHelpArticle(null)}
                  className="text-xs font-bold text-[#0B5CFF] hover:underline"
                >
                  &larr; Back to Help articles
                </button>
                <h4 className="text-base font-extrabold text-[#1F1F1F]">{selectedHelpArticle.title}</h4>
                <p className="text-sm text-[#4A4A4A] whitespace-pre-line leading-relaxed bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]/40">
                  {selectedHelpArticle.content}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setShowHelpModal(false); setSelectedHelpArticle(null); }}
                    className="rounded-lg bg-[#0B5CFF] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#747487]">Select a topic below to read detailed help articles:</p>
                <div className="space-y-2">
                  {helpArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedHelpArticle(article)}
                      className="w-full text-left p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#0B5CFF] hover:bg-[#F0F5FF]/30 transition-all font-semibold text-sm text-[#1F1F1F] flex justify-between items-center group"
                    >
                      <span>{article.title}</span>
                      <span className="text-[#747487] group-hover:text-[#0B5CFF] font-bold">&rarr;</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-4 border-t border-[#F3F3F3]">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3.5 mb-4">
              <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#0B5CFF]" />
                <span>Contact Support</span>
              </h3>
              <button 
                onClick={() => setShowContactModal(false)}
                className="rounded-full p-1.5 hover:bg-[#F3F3F3] text-[#747487] hover:text-[#1F1F1F]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue..."
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Category</label>
                <select
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white font-semibold cursor-pointer"
                >
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing & Plan</option>
                  <option value="account">Account Access</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your issue or request here..."
                  value={contactDescription}
                  onChange={(e) => setContactDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] p-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F3F3]">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B5CFF] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

