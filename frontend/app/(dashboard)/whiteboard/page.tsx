"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Square,
  Circle,
  Type,
  Eraser,
  Trash2,
  Download,
  Undo,
  Redo,
  ChevronDown,
  Palette,
  Minus,
  Maximize2,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";

type Tool = "pencil" | "rectangle" | "circle" | "text" | "eraser";

interface Point {
  x: number;
  y: number;
}

export default function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#1F1F1F");
  const [lineWidth, setLineWidth] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineWidthPicker, setShowLineWidthPicker] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Drawing start point for shapes
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [canvasSnapshot, setCanvasSnapshot] = useState<ImageData | null>(null);

  // Setup canvas sizes & context on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive sizing
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.max(500, window.innerHeight - 260);
    }

    const context = canvas.getContext("2d");
    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      contextRef.current = context;
      
      // Save initial blank state to history
      const blankState = canvas.toDataURL();
      setHistory([blankState]);
      setHistoryStep(0);
    }

    // Handle resize
    const handleResize = () => {
      if (!canvas || !contextRef.current) return;
      const tempImage = new Image();
      const currentDataUrl = canvas.toDataURL();
      
      const nextContainer = canvas.parentElement;
      if (nextContainer) {
        canvas.width = nextContainer.clientWidth;
        canvas.height = Math.max(500, window.innerHeight - 260);
      }
      
      // Restore drawings on resize
      tempImage.src = currentDataUrl;
      tempImage.onload = () => {
        contextRef.current?.drawImage(tempImage, 0, 0);
      };
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update canvas style properties when states change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentTool === "eraser" ? "#FFFFFF" : color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth, currentTool]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    
    setHistory([...newHistory, currentUrl]);
    setHistoryStep(newHistory.length);
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setIsDrawing(true);

    if (currentTool === "pencil" || currentTool === "eraser") {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
    } else {
      // Shape tools snapshot current canvas
      const ctx = contextRef.current;
      setCanvasSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "pencil" || currentTool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (canvasSnapshot) {
      // Restore screenshot before drawing shape preview
      ctx.putImageData(canvasSnapshot, 0, 0);
      
      ctx.beginPath();
      if (currentTool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
      } else if (currentTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
        );
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const handleStopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentTool === "text" && contextRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const text = prompt("Enter your text:");
      if (text) {
        ctx.font = `${lineWidth * 3 + 12}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        saveToHistory();
      }
    } else {
      saveToHistory();
    }
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const nextStep = historyStep - 1;
    const img = new Image();
    img.src = history[nextStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(nextStep);
    };
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const nextStep = historyStep + 1;
    const img = new Image();
    img.src = history[nextStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(nextStep);
    };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    toast.success("Whiteboard cleared.");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `zoom-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Whiteboard exported as PNG!");
  };

  const colors = [
    "#1F1F1F", // Black
    "#0B5CFF", // Blue
    "#22C55E", // Green
    "#E34040", // Red
    "#EAB308", // Yellow
    "#A855F7", // Purple
    "#EC4899", // Pink
    "#F97316", // Orange
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header toolbar bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5E5E5]/50 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0B5CFF]">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F1F1F]">Interactive Whiteboard</h2>
            <p className="text-xs text-[#747487]">Sketch ideas, plan diagrams, and export notes</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F3F3F3] text-[#747487] disabled:opacity-40 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F3F3F3] text-[#747487] disabled:opacity-40 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>

          <div className="h-5 w-[1px] bg-[#E5E5E5] mx-1"></div>

          {/* Clear board */}
          <button
            onClick={handleClear}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#FDF2F2] hover:text-[#E34040] hover:border-[#E34040]/30 px-3 text-xs font-bold text-[#747487] transition-all"
            title="Clear canvas"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          {/* Export */}
          <button
            onClick={handleDownload}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#0B5CFF] hover:bg-[#0E72ED] px-4 text-xs font-bold text-white shadow-sm transition-all"
            title="Export image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        
        {/* Sidebar Tool selection panel */}
        <div className="flex md:flex-col flex-wrap gap-2 rounded-xl border border-[#E5E5E5]/50 bg-white p-3 shadow-sm md:w-[68px] items-center shrink-0 justify-center">
          <span className="hidden md:block text-[9px] font-bold text-[#747487] uppercase tracking-wider mb-2">Tools</span>

          {/* Pencil */}
          <button
            onClick={() => setCurrentTool("pencil")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              currentTool === "pencil"
                ? "bg-[#EBF2FF] text-[#0B5CFF]"
                : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
            title="Pen"
          >
            <PenTool className="h-4.5 w-4.5" />
          </button>

          {/* Rectangle */}
          <button
            onClick={() => setCurrentTool("rectangle")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              currentTool === "rectangle"
                ? "bg-[#EBF2FF] text-[#0B5CFF]"
                : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
            title="Rectangle"
          >
            <Square className="h-4.5 w-4.5" />
          </button>

          {/* Circle */}
          <button
            onClick={() => setCurrentTool("circle")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              currentTool === "circle"
                ? "bg-[#EBF2FF] text-[#0B5CFF]"
                : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
            title="Circle"
          >
            <Circle className="h-4.5 w-4.5" />
          </button>

          {/* Text tool */}
          <button
            onClick={() => setCurrentTool("text")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              currentTool === "text"
                ? "bg-[#EBF2FF] text-[#0B5CFF]"
                : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
            title="Add text"
          >
            <Type className="h-4.5 w-4.5" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => setCurrentTool("eraser")}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              currentTool === "eraser"
                ? "bg-[#EBF2FF] text-[#0B5CFF]"
                : "text-[#747487] hover:bg-[#F3F3F3]"
            }`}
            title="Eraser"
          >
            <Eraser className="h-4.5 w-4.5" />
          </button>

          <div className="h-[1px] w-6 bg-[#E5E5E5] my-2 hidden md:block"></div>

          {/* Color Picker triggers */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowLineWidthPicker(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F3F3F3] text-[#747487]"
              title="Change color"
            >
              <Palette className="h-4.5 w-4.5" style={{ color: currentTool === "eraser" ? "#9ca3af" : color }} />
            </button>
            
            {showColorPicker && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 md:left-full md:translate-x-2 md:-top-4 z-40 grid grid-cols-4 gap-2 rounded-lg border border-[#E5E5E5] bg-white p-2 shadow-lg w-[120px]">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      if (currentTool === "eraser") setCurrentTool("pencil");
                      setShowColorPicker(false);
                    }}
                    className={`h-6 w-6 rounded-full border transition-all ${
                      color === c ? "border-[#0B5CFF] scale-110" : "border-[#E5E5E5] hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Brush thickness select */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLineWidthPicker(!showLineWidthPicker);
                setShowColorPicker(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F3F3F3] text-[#747487]"
              title="Line thickness"
            >
              <Minus className="h-4.5 w-4.5" style={{ strokeWidth: lineWidth / 2 + 1 }} />
            </button>

            {showLineWidthPicker && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 md:left-full md:translate-x-2 md:-top-4 z-40 flex flex-col gap-2 rounded-lg border border-[#E5E5E5] bg-white p-3.5 shadow-lg w-[140px] text-xs font-bold text-[#1F1F1F]">
                <span>Thickness: {lineWidth}px</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer bg-[#E5E5E5] accent-[#0B5CFF] rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area Container */}
        <div className="flex-1 rounded-xl border border-[#E5E5E5]/50 bg-white shadow-sm overflow-hidden relative min-h-[500px] flex items-stretch">
          {/* Grid Background overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          <canvas
            ref={canvasRef}
            onMouseDown={handleStartDrawing}
            onMouseMove={handleDrawing}
            onMouseUp={handleStopDrawing}
            onMouseLeave={handleStopDrawing}
            className="flex-1 cursor-crosshair z-10 touch-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
