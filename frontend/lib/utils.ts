import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Class merging utility for styling overrides
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get or generate a persistent Personal Meeting ID (PMI)
export function getOrCreatePersonalPmi(): string {
  if (typeof window === "undefined") return "1234567890";
  try {
    let pmi = localStorage.getItem("zoom_clone_personal_pmi");
    if (!pmi) {
      pmi = String(Math.floor(1000000000 + Math.random() * 9000000000));
      localStorage.setItem("zoom_clone_personal_pmi", pmi);
    }
    return pmi.replace(/\D/g, ""); // Ensure only digits
  } catch (_) {
    return "1234567890";
  }
}

// Get or generate a persistent Personal Passcode
export function getOrCreatePersonalPasscode(): string {
  if (typeof window === "undefined") return "ZOOM2026";
  try {
    let passcode = localStorage.getItem("zoom_clone_personal_passcode");
    if (!passcode) {
      passcode = "ZOOM2026";
      localStorage.setItem("zoom_clone_personal_passcode", passcode);
    }
    return passcode;
  } catch (_) {
    return "ZOOM2026";
  }
}

/**
 * API datetimes are stored as UTC but often serialized without a timezone suffix.
 * Parse them as UTC so the UI can show the user's local time correctly.
 */
export function parseApiDateTime(iso: string): Date {
  if (!iso) return new Date(NaN);
  const trimmed = iso.trim();
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  return new Date(`${trimmed}Z`);
}

/** Display meeting date/time in the visitor's local timezone. */
export function formatMeetingDateTime(iso: string): string {
  const d = parseApiDateTime(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Formats raw digits e.g. "1234567890" into Zoom format "123-456-7890"
export function formatMeetingId(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Yields a deterministic background color class based on user's name
export function generateAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-[#0B5CFF]", // Zoom primary
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

// Translates minutes into structured hours & minutes text
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hourText = hours === 1 ? "1 hour" : `${hours} hours`;
  if (mins === 0) return hourText;
  return `${hourText} ${mins} minutes`;
}

// Robust clipboard copying with synchronous textarea copy fallback
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  
  // Fallback selector method
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    textArea.remove();
    if (!successful) {
      throw new Error("Copy execution failed");
    }
  } catch (err) {
    textArea.remove();
    throw new Error("Unable to copy content to clipboard");
  }
}
