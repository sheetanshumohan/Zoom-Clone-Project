import type { Config } from "tailwindcss";

const config: Config = {
  // Specify paths to all files where Tailwind utility classes are used
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Zoom brand identity color palette
      colors: {
        primary: "#0B5CFF",       // Zoom Blue
        primaryHover: "#0E72ED",  // Hover Zoom Blue
        background: "#F3F3F3",    // Meeting/dashboard background light gray
        surface: "#FFFFFF",       // White background for cards and panels
        textDark: "#1F1F1F",      // Off-black primary text
        textMuted: "#747487",     // Secondary grey text
        border: "#E5E5E5",        // Fine borders
        danger: "#E34040",        // Red cancel/leave meeting buttons
        success: "#22C55E",       // Green confirm/active indicators
      },
      // Smooth modern sans-serif typography
      fontFamily: {
        sans: ["Lato", "system-ui", "sans-serif"],
      },
      // Rounded corners matching modern client interface
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      // Zoom's signature card and panel shadows
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.08)",
        modal: "0 8px 28px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
