"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Volume2,
  Mic,
  Video as VideoIcon,
  Shield,
  User,
  Sliders,
  Tv,
  MessageSquare,
  Image as ImageIcon,
  Disc,
  Check,
  Camera,
  Play,
  Square,
} from "lucide-react";
import { toast } from "sonner";

type SettingsCategory =
  | "general"
  | "video"
  | "audio"
  | "share"
  | "chat"
  | "background"
  | "recording"
  | "profile";

function SettingsPageContent() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SettingsCategory | null;

  useEffect(() => {
    if (tabParam && ["general", "video", "audio", "share", "chat", "background", "recording", "profile"].includes(tabParam)) {
      setActiveCategory(tabParam);
    } else if (!tabParam) {
      setActiveCategory("general");
    }
  }, [tabParam]);

  // Sidebar items definition
  const categories: { id: SettingsCategory; label: string }[] = [
    { id: "general", label: "General" },
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
    { id: "share", label: "Share Screen" },
    { id: "chat", label: "Chat" },
    { id: "background", label: "Background & Filters" },
    { id: "recording", label: "Recording" },
    { id: "profile", label: "Profile" },
  ];

  // ================= GENERAL PANEL STATE =================
  const [confirmOnLeave, setConfirmOnLeave] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [dualMonitors, setDualMonitors] = useState(false);
  const [autoFullscreen, setAutoFullscreen] = useState(false);
  
  const [whoCanShare, setWhoCanShare] = useState("host");
  const [whoCanStartShare, setWhoCanStartShare] = useState("host");
  
  const [scheduleHostVideo, setScheduleHostVideo] = useState(true);
  const [schedulePartVideo, setSchedulePartVideo] = useState(false);
  const [scheduleAudioType, setScheduleAudioType] = useState("both");

  // ================= VIDEO PANEL STATE =================
  const [videoSource, setVideoSource] = useState("HD Web Camera");
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [touchUp, setTouchUp] = useState(false);
  const [showNames, setShowNames] = useState(true);

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (activeCategory !== "video") {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
        setPreviewStream(null);
      }
      return;
    }

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: hdVideo ? { width: 1280, height: 720 } : { width: 640, height: 480 },
          audio: false
        });
        if (active) {
          setPreviewStream(stream);
          // Wait briefly for element mount
          setTimeout(() => {
            if (videoPreviewRef.current) {
              videoPreviewRef.current.srcObject = stream;
            }
          }, 100);
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("Could not start camera preview:", err);
      }
    };

    startCamera();

    return () => {
      active = false;
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCategory, hdVideo]);

  // Auto-persist video settings to localStorage on change
  useEffect(() => {
    try {
      const videoSettings = {
        videoSource,
        mirrorVideo,
        hdVideo,
        touchUp,
        showNames
      };
      localStorage.setItem("zoom_clone_video_settings", JSON.stringify(videoSettings));
    } catch (err) {
      console.error("Failed to save video settings:", err);
    }
  }, [videoSource, mirrorVideo, hdVideo, touchUp, showNames]);

  // ================= AUDIO PANEL STATE =================
  const [speakerSource, setSpeakerSource] = useState("Speakers (Realtek Audio)");
  const [speakerVol, setSpeakerVol] = useState(80);
  const [micSource, setMicSource] = useState("Microphone (Realtek Audio)");
  const [micLevel, setMicLevel] = useState(0);
  const [testingMic, setTestingMic] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState("auto");

  // ================= SHARE PANEL STATE =================
  const [confirmOnShare, setConfirmOnShare] = useState(true);
  const [optimizeShare, setOptimizeShare] = useState(true);
  const [shareFps, setShareFps] = useState("30");
  const [shareMode, setShareMode] = useState("fullscreen");

  // ================= CHAT PANEL STATE =================
  const [unreadBadge, setUnreadBadge] = useState(true);
  const [chatSound, setChatSound] = useState(true);
  const [chatPreview, setChatPreview] = useState(true);
  const [chatAutoScroll, setChatAutoScroll] = useState(true);

  // ================= BACKGROUND PANEL STATE =================
  const [virtualBackground, setVirtualBackground] = useState("none");
  const [videoFilter, setVideoFilter] = useState("none");

  // ================= RECORDING PANEL STATE =================
  const [recordingPath, setRecordingPath] = useState("C:\\Users\\VICTUS\\Videos\\Zoom");
  const [recordSeparate, setRecordSeparate] = useState(false);
  const [recordTimestamp, setRecordTimestamp] = useState(true);
  const [keepTempFiles, setKeepTempFiles] = useState(false);

  // Microphone Animation & Real Web Audio Analysis
  const micIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (testingMic) {
      let active = true;
      let stream: MediaStream | null = null;
      let audioCtx: AudioContext | null = null;
      let analyser: AnalyserNode | null = null;
      
      const startMicLevel = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          audioStreamRef.current = stream;
          
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const updateLevel = () => {
            if (!active || !analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Map average frequency values to 0-100% width
            const mapped = Math.min(100, Math.floor((average / 140) * 100));
            setMicLevel(mapped);
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        } catch (err) {
          console.warn("Real mic diagnostics access failed, falling back to simulation:", err);
          micIntervalRef.current = setInterval(() => {
            setMicLevel(Math.floor(10 + Math.random() * 80));
          }, 120);
        }
      };
      
      startMicLevel();
      
      return () => {
        active = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (micIntervalRef.current) clearInterval(micIntervalRef.current);
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }
      };
    } else {
      setMicLevel(0);
    }
  }, [testingMic]);

  // Speaker Animation & Tone Generator
  const handleTestSpeaker = () => {
    if (testingSpeaker) {
      setTestingSpeaker(false);
      toast.info("Speaker test stopped.");
    } else {
      setTestingSpeaker(true);
      toast.success("Playing test sound...");
      
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        const now = audioCtx.currentTime;
        oscillator.frequency.setValueAtTime(659.25, now); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.3); // G5
        oscillator.frequency.setValueAtTime(1046.50, now + 0.6); // C6
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime((speakerVol / 100) * 0.3, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.9);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(now);
        oscillator.stop(now + 1.0);
        
        setTimeout(() => {
          setTestingSpeaker(false);
        }, 1200);
      } catch (err) {
        console.warn("Could not play speaker test chime:", err);
        setTimeout(() => {
          setTestingSpeaker(false);
        }, 4000);
      }
    }
  };

  // Auto-persist share settings to localStorage on change
  useEffect(() => {
    try {
      const shareSettings = { confirmOnShare, optimizeShare, shareFps, shareMode };
      localStorage.setItem("zoom_clone_share_settings", JSON.stringify(shareSettings));
    } catch (err) {
      console.error(err);
    }
  }, [confirmOnShare, optimizeShare, shareFps, shareMode]);

  // Auto-persist chat settings to localStorage on change
  useEffect(() => {
    try {
      const chatSettings = { unreadBadge, chatSound, chatPreview, chatAutoScroll };
      localStorage.setItem("zoom_clone_chat_settings", JSON.stringify(chatSettings));
    } catch (err) {
      console.error(err);
    }
  }, [unreadBadge, chatSound, chatPreview, chatAutoScroll]);

  // Auto-persist background settings to localStorage on change
  useEffect(() => {
    try {
      const bgSettings = { virtualBackground, videoFilter };
      localStorage.setItem("zoom_clone_background_settings", JSON.stringify(bgSettings));
    } catch (err) {
      console.error(err);
    }
  }, [virtualBackground, videoFilter]);

  // Auto-persist recording settings to localStorage on change
  useEffect(() => {
    try {
      const recSettings = { recordingPath, recordSeparate, recordTimestamp, keepTempFiles };
      localStorage.setItem("zoom_clone_recording_settings", JSON.stringify(recSettings));
    } catch (err) {
      console.error(err);
    }
  }, [recordingPath, recordSeparate, recordTimestamp, keepTempFiles]);

  // ================= PROFILE PANEL STATE =================
  const [displayName, setDisplayName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@zoomclone.dev");
  const [department, setDepartment] = useState("Product & Design");
  const [jobTitle, setJobTitle] = useState("Senior UX Architect");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarColor, setAvatarColor] = useState<string>("#0B5CFF");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("zoom_clone_profile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (parsed.avatarColor) setAvatarColor(parsed.avatarColor);
      }

      const storedGeneral = localStorage.getItem("zoom_clone_general_settings");
      if (storedGeneral) {
        const parsed = JSON.parse(storedGeneral);
        if (parsed.confirmOnLeave !== undefined) setConfirmOnLeave(parsed.confirmOnLeave);
        if (parsed.showDuration !== undefined) setShowDuration(parsed.showDuration);
        if (parsed.showControls !== undefined) setShowControls(parsed.showControls);
        if (parsed.dualMonitors !== undefined) setDualMonitors(parsed.dualMonitors);
        if (parsed.autoFullscreen !== undefined) setAutoFullscreen(parsed.autoFullscreen);
        if (parsed.whoCanShare !== undefined) setWhoCanShare(parsed.whoCanShare);
        if (parsed.whoCanStartShare !== undefined) setWhoCanStartShare(parsed.whoCanStartShare);
      }

      const storedShare = localStorage.getItem("zoom_clone_share_settings");
      if (storedShare) {
        const parsed = JSON.parse(storedShare);
        if (parsed.confirmOnShare !== undefined) setConfirmOnShare(parsed.confirmOnShare);
        if (parsed.optimizeShare !== undefined) setOptimizeShare(parsed.optimizeShare);
        if (parsed.shareFps !== undefined) setShareFps(parsed.shareFps);
        if (parsed.shareMode !== undefined) setShareMode(parsed.shareMode);
      }

      const storedChat = localStorage.getItem("zoom_clone_chat_settings");
      if (storedChat) {
        const parsed = JSON.parse(storedChat);
        if (parsed.unreadBadge !== undefined) setUnreadBadge(parsed.unreadBadge);
        if (parsed.chatSound !== undefined) setChatSound(parsed.chatSound);
        if (parsed.chatPreview !== undefined) setChatPreview(parsed.chatPreview);
        if (parsed.chatAutoScroll !== undefined) setChatAutoScroll(parsed.chatAutoScroll);
      }

      const storedBg = localStorage.getItem("zoom_clone_background_settings");
      if (storedBg) {
        const parsed = JSON.parse(storedBg);
        if (parsed.virtualBackground !== undefined) setVirtualBackground(parsed.virtualBackground);
        if (parsed.videoFilter !== undefined) setVideoFilter(parsed.videoFilter);
      }

      const storedRec = localStorage.getItem("zoom_clone_recording_settings");
      if (storedRec) {
        const parsed = JSON.parse(storedRec);
        if (parsed.recordingPath !== undefined) setRecordingPath(parsed.recordingPath);
        if (parsed.recordSeparate !== undefined) setRecordSeparate(parsed.recordSeparate);
        if (parsed.recordTimestamp !== undefined) setRecordTimestamp(parsed.recordTimestamp);
        if (parsed.keepTempFiles !== undefined) setKeepTempFiles(parsed.keepTempFiles);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  // Auto-persist general settings to localStorage on change
  useEffect(() => {
    try {
      const generalSettings = {
        confirmOnLeave,
        showDuration,
        showControls,
        dualMonitors,
        autoFullscreen,
        whoCanShare,
        whoCanStartShare
      };
      localStorage.setItem("zoom_clone_general_settings", JSON.stringify(generalSettings));
    } catch (err) {
      console.error("Failed to save general settings:", err);
    }
  }, [confirmOnLeave, showDuration, showControls, dualMonitors, autoFullscreen, whoCanShare, whoCanStartShare]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success("Profile photo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    toast.success("Profile photo removed.");
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = {
        displayName,
        email,
        department,
        jobTitle,
        avatarUrl,
        avatarColor
      };
      localStorage.setItem("zoom_clone_profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("profileUpdate"));
      toast.success("Profile changes saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Could not save profile changes.");
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row min-h-[calc(100vh-120px)] w-full items-stretch">
      
      {/* 1. Left Sidebar Selector */}
      <div className="w-full shrink-0 border-b border-[#E5E5E5]/60 pb-4 lg:w-[200px] lg:border-b-0 lg:border-r lg:border-[#E5E5E5]/60 lg:pb-0 lg:pr-4">
        <h3 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-[#747487] mb-4 px-2">Settings</h3>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition-all w-fit lg:w-full ${
                activeCategory === cat.id
                  ? "bg-[#EBF2FF] text-[#0B5CFF] border-l-0 lg:border-l-[3px] lg:border-l-[#0B5CFF] lg:rounded-l-none"
                  : "text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 2. Right Content Render Area */}
      <div className="flex-1 lg:pl-6 max-w-4xl py-2">
        
        {/* ================= GENERAL SETTINGS PANEL ================= */}
        {activeCategory === "general" && (
          <div className="space-y-6">
            
            {/* Section 1: Meeting config */}
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3 mb-4">
                Meetings
              </h4>
              
              <div className="space-y-4">
                {/* Switch 1 */}
                <div className="flex items-center justify-between py-2 border-b border-[#F8F8F8]">
                  <div>
                    <span className="block text-sm font-semibold text-[#1F1F1F]">
                      Ask me to confirm when I leave a meeting
                    </span>
                    <span className="block text-xs text-[#747487]">
                      Prompt confirmation dialog to prevent accidental exits.
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={confirmOnLeave}
                      onChange={(e) => setConfirmOnLeave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {/* Switch 2 */}
                <div className="flex items-center justify-between py-2 border-b border-[#F8F8F8]">
                  <div>
                    <span className="block text-sm font-semibold text-[#1F1F1F]">
                      Show my meeting duration
                    </span>
                    <span className="block text-xs text-[#747487]">
                      Displays running meeting clock timer inside rooms.
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={showDuration}
                      onChange={(e) => setShowDuration(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {/* Switch 3 */}
                <div className="flex items-center justify-between py-2 border-b border-[#F8F8F8]">
                  <div>
                    <span className="block text-sm font-semibold text-[#1F1F1F]">
                      Always show meeting controls
                    </span>
                    <span className="block text-xs text-[#747487]">
                      Lock bottom navigation bars; prevent auto-hiding.
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={showControls}
                      onChange={(e) => setShowControls(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {/* Switch 4 */}
                <div className="flex items-center justify-between py-2 border-b border-[#F8F8F8]">
                  <div>
                    <span className="block text-sm font-semibold text-[#1F1F1F]">
                      Use dual monitors
                    </span>
                    <span className="block text-xs text-[#747487]">
                      Render presentation slide share on secondary displays.
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={dualMonitors}
                      onChange={(e) => setDualMonitors(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                {/* Switch 5 */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="block text-sm font-semibold text-[#1F1F1F]">
                      Enter full screen automatically
                    </span>
                    <span className="block text-xs text-[#747487]">
                      Expand workspace to full width upon launching meeting rooms.
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={autoFullscreen}
                      onChange={(e) => setAutoFullscreen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Sharing rules */}
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3 mb-4">
                Content Sharing
              </h4>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#747487] mb-2">
                    Who can share?
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="whoshare"
                        value="host"
                        checked={whoCanShare === "host"}
                        onChange={() => setWhoCanShare("host")}
                        className="h-4 w-4 accent-[#0B5CFF]"
                      />
                      Host Only
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="whoshare"
                        value="all"
                        checked={whoCanShare === "all"}
                        onChange={() => setWhoCanShare("all")}
                        className="h-4 w-4 accent-[#0B5CFF]"
                      />
                      All Participants
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#747487] mb-2">
                    Who can start sharing when someone else is sharing?
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="whostartshare"
                        value="host"
                        checked={whoCanStartShare === "host"}
                        onChange={() => setWhoCanStartShare("host")}
                        className="h-4 w-4 accent-[#0B5CFF]"
                      />
                      Host Only
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                      <input
                        type="radio"
                        name="whostartshare"
                        value="all"
                        checked={whoCanStartShare === "all"}
                        onChange={() => setWhoCanStartShare("all")}
                        className="h-4 w-4 accent-[#0B5CFF]"
                      />
                      All Participants
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= VIDEO SETTINGS PANEL ================= */}
        {activeCategory === "video" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Video Camera Preview
            </h4>

            {/* Video Source Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Camera Source Device</label>
              <select
                value={videoSource}
                onChange={(e) => setVideoSource(e.target.value)}
                className="flex h-10 w-full max-w-sm rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer font-semibold"
              >
                <option value="HD Web Camera">HD Web Camera (Integrated)</option>
                <option value="OBS Virtual Camera">OBS Virtual Camera</option>
              </select>
            </div>

            {/* Video Preview Box (incorporates mirroring classes dynamically) */}
            <div className="relative aspect-[16/9] w-full max-w-[400px] overflow-hidden rounded-xl bg-gradient-to-br from-[#2D2D2D] to-[#1F1F1F] border border-[#3E3E3E] flex items-center justify-center shadow-md">
              {previewStream ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover transition-all ${mirrorVideo ? "scale-x-[-1]" : ""}`}
                  style={{
                    filter: touchUp ? "blur(0.8px) contrast(95%) brightness(105%) saturate(102%)" : "none"
                  }}
                />
              ) : (
                /* Camera Preview Simulation Overlay */
                <div className={`absolute inset-0 bg-[#3A3A3A]/20 transition-all ${mirrorVideo ? "scale-x-[-1]" : ""}`}>
                  {/* Geometric camera mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-white/50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Status flags inside screen */}
              <div className="absolute top-3 left-3 bg-black/60 rounded px-2 py-0.5 text-[9px] font-mono border border-white/5 text-white">
                {videoSource}
              </div>
              
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#0B5CFF] rounded px-2 py-0.5 text-[9px] font-bold text-white">
                {hdVideo ? "HD 1080P" : "SD 480P"}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={mirrorVideo}
                  onChange={(e) => setMirrorVideo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Mirror my video</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hdVideo}
                  onChange={(e) => setHdVideo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Enable High Definition (HD)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={touchUp}
                  onChange={(e) => setTouchUp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Touch up my appearance (Soft Filter)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showNames}
                  onChange={(e) => setShowNames(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Always display participant names on video tiles</span>
              </label>
            </div>
          </div>
        )}

        {/* ================= AUDIO SETTINGS PANEL ================= */}
        {activeCategory === "audio" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Audio Diagnostics
            </h4>

            {/* Speaker Section */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487] block">Speaker Outputs</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={speakerSource}
                  onChange={(e) => setSpeakerSource(e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer font-semibold"
                >
                  <option value="Speakers (Realtek Audio)">Speakers (Realtek Audio)</option>
                  <option value="Headphones (Bluetooth Audio)">Headphones (Bluetooth Audio)</option>
                </select>
                
                <button
                  type="button"
                  onClick={handleTestSpeaker}
                  className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
                    testingSpeaker
                      ? "border-[#E34040] text-[#E34040] bg-red-50"
                      : "border-[#0B5CFF] text-[#0B5CFF] hover:bg-[#0B5CFF] hover:text-white"
                  }`}
                >
                  {testingSpeaker ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{testingSpeaker ? "Stop" : "Test Speaker"}</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1 w-full max-w-md pt-1">
                <div className="flex justify-between items-center text-xs font-semibold text-[#747487]">
                  <span>Speaker Volume</span>
                  <span>{speakerVol}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-[#747487]" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={speakerVol}
                    onChange={(e) => setSpeakerVol(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer rounded-lg bg-[#E5E5E5] accent-[#0B5CFF]"
                  />
                </div>
              </div>
            </div>

            <hr className="border-[#F3F3F3]" />

            {/* Mic Section */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487] block">Microphone Inputs</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={micSource}
                  onChange={(e) => setMicSource(e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer font-semibold"
                >
                  <option value="Microphone (Realtek Audio)">Microphone (Realtek Audio)</option>
                  <option value="External Mic (Aux Line)">External Mic (Aux Line)</option>
                </select>
                
                <button
                  type="button"
                  onClick={() => setTestingMic(!testingMic)}
                  className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
                    testingMic
                      ? "border-[#E34040] text-[#E34040] bg-red-50"
                      : "border-[#0B5CFF] text-[#0B5CFF] hover:bg-[#0B5CFF] hover:text-white"
                  }`}
                >
                  {testingMic ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>{testingMic ? "Stop Testing" : "Test Mic"}</span>
                </button>
              </div>

              {/* Simulated input level bar */}
              <div className="space-y-1 w-full max-w-md pt-1">
                <span className="block text-xs font-semibold text-[#747487]">Microphone Input Level</span>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${testingMic ? micLevel : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <hr className="border-[#F3F3F3]" />

            {/* Noise Suppression */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#747487] block">Noise Suppression</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["auto", "low", "medium", "high"] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold capitalize transition-all select-none ${
                      noiseSuppression === level
                        ? "border-[#0B5CFF] bg-[#EBF2FF] text-[#0B5CFF]"
                        : "border-[#E5E5E5] text-[#747487] hover:bg-[#F3F3F3]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="noisesup"
                      value={level}
                      checked={noiseSuppression === level}
                      onChange={() => setNoiseSuppression(level)}
                      className="sr-only"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= PROFILE PANEL ================= */}
        {activeCategory === "profile" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              My Profile Settings
            </h4>

            <form onSubmit={handleProfileSave} className="space-y-5">
              {/* Large Avatar container */}
              <div className="flex items-center gap-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*"
                />
                
                <div 
                  onClick={handlePhotoClick}
                  className="flex h-20 w-20 items-center justify-center rounded-full text-white text-2xl font-bold border border-black/5 relative group cursor-pointer overflow-hidden shadow-inner shrink-0"
                  style={{ backgroundColor: avatarUrl ? "transparent" : avatarColor }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    displayName
                      ? displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "JD"
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <span className="block text-base font-bold text-[#1F1F1F]">{displayName}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      className="text-xs font-semibold text-[#0B5CFF] hover:underline"
                    >
                      Change photo
                    </button>
                    {avatarUrl && (
                      <>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-xs font-semibold text-[#E34040] hover:underline"
                        >
                          Remove photo
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Color Palette Choices (only visible if no avatar photo is uploaded) */}
                  {!avatarUrl && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#747487] font-semibold mr-1">Theme:</span>
                      {[
                        "#0B5CFF", // Blue
                        "#8B5CF6", // Purple
                        "#EC4899", // Pink
                        "#10B981", // Emerald
                        "#F59E0B", // Amber
                        "#6366F1", // Indigo
                        "#374151"  // Dark Grey
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAvatarColor(color)}
                          className={`rounded-full border transition-all ${
                            avatarColor === color ? "ring-2 ring-[#0B5CFF]/45 border-white scale-110" : "border-black/10 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color, width: "18px", height: "18px" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] font-semibold"
                  />
                </div>
              </div>

              {/* Submit Save changes */}
              <div className="border-t border-[#F3F3F3] pt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B5CFF] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= SHARE PANEL ================= */}
        {activeCategory === "share" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Screen Share Diagnostics
            </h4>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={confirmOnShare}
                  onChange={(e) => setConfirmOnShare(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Ask for confirmation before sharing screen</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={optimizeShare}
                  onChange={(e) => setOptimizeShare(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Optimize screen share video performance (Frame Rate)</span>
              </label>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Screen Share FPS Limit</label>
                <select
                  value={shareFps}
                  onChange={(e) => setShareFps(e.target.value)}
                  className="flex h-10 w-full max-w-sm rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer font-semibold"
                >
                  <option value="15">15 FPS (Slide Presentation)</option>
                  <option value="30">30 FPS (Standard Video)</option>
                  <option value="60">60 FPS (High Performance / Gaming)</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Desktop Share Mode</label>
                <select
                  value={shareMode}
                  onChange={(e) => setShareMode(e.target.value)}
                  className="flex h-10 w-full max-w-sm rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-white cursor-pointer font-semibold"
                >
                  <option value="fullscreen">Full Desktop Screen</option>
                  <option value="window">Single Application Window Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= CHAT PANEL ================= */}
        {activeCategory === "chat" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Meeting Chat Configurations
            </h4>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={unreadBadge}
                  onChange={(e) => setUnreadBadge(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Display badge for unread chat messages</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={chatSound}
                  onChange={(e) => setChatSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Play a sound notification on new message arrival</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={chatPreview}
                  onChange={(e) => setChatPreview(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Show brief pop-up preview of new messages</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={chatAutoScroll}
                  onChange={(e) => setChatAutoScroll(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F]">Auto-scroll to the bottom of the chat drawer</span>
              </label>
            </div>
          </div>
        )}

        {/* ================= BACKGROUND PANEL ================= */}
        {activeCategory === "background" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Virtual Backgrounds & Filters
            </h4>
            
            <div className="space-y-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#747487]">Select Virtual Background</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: "none", name: "None", class: "bg-gray-100 text-gray-800" },
                  { id: "blur", name: "Blur", class: "bg-slate-200 text-slate-800 backdrop-blur-md" },
                  { id: "office", name: "Modern Office", class: "bg-blue-100 text-blue-900 border border-blue-200" },
                  { id: "beach", name: "Sunny Beach", class: "bg-amber-50 text-amber-900 border border-amber-200" },
                  { id: "library", name: "Cozy Library", class: "bg-orange-100 text-orange-950 border border-orange-200" }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setVirtualBackground(bg.id);
                      toast.success(`Virtual background set to ${bg.name}`);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg p-3 text-xs font-bold transition-all h-20 text-center ${bg.class} ${
                      virtualBackground === bg.id
                        ? "ring-2 ring-[#0B5CFF] scale-105 shadow-sm"
                        : "opacity-75 hover:opacity-100 hover:scale-102"
                    }`}
                  >
                    <span className="font-semibold text-center">{bg.name}</span>
                  </button>
                ))}
              </div>

              <span className="block text-xs font-bold uppercase tracking-wider text-[#747487] pt-2">Select Video Filter</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "none", name: "None / Normal" },
                  { id: "cinematic", name: "Cinematic Mode" },
                  { id: "cool", name: "Cool Tones" },
                  { id: "warm", name: "Warm Glow" }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setVideoFilter(filter.id);
                      toast.success(`Video filter set to ${filter.name}`);
                    }}
                    className={`flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      videoFilter === filter.id
                        ? "border-[#0B5CFF] bg-[#EBF2FF] text-[#0B5CFF] scale-105 shadow-sm"
                        : "border-[#E5E5E5] text-[#747487] hover:bg-[#F3F3F3]"
                    }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= RECORDING PANEL ================= */}
        {activeCategory === "recording" && (
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#747487] border-b border-[#F3F3F3] pb-3">
              Local Recording Diagnostics
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Local File Storage Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recordingPath}
                    onChange={(e) => setRecordingPath(e.target.value)}
                    className="flex h-10 flex-1 rounded-lg border border-[#E5E5E5] px-3 text-sm outline-none focus:border-[#0B5CFF] bg-gray-50 text-gray-600 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Folder picker simulation selected.");
                    }}
                    className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-xs font-bold text-[#1F1F1F] bg-white hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Browse...
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={recordSeparate}
                    onChange={(e) => setRecordSeparate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                    <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                  </div>
                  <span className="text-sm font-medium text-[#1F1F1F]">Record active speaker, gallery view, and shared screen separately</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={recordTimestamp}
                    onChange={(e) => setRecordTimestamp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                    <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                  </div>
                  <span className="text-sm font-medium text-[#1F1F1F]">Add a timestamp clock overlay to the recording file</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={keepTempFiles}
                    onChange={(e) => setKeepTempFiles(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                    <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                  </div>
                  <span className="text-sm font-medium text-[#1F1F1F]">Keep temporary recording files (helps recovery on crash)</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B5CFF] border-t-transparent" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
