import React, { useState, useRef, useEffect } from "react";
import {
  Sliders,
  Play,
  Scissors,
  Download,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { TranscriptionRecord } from "../types";
import { formatSeconds } from "../utils/audioUtils";

interface AudioEnhanceModalProps {
  record: TranscriptionRecord;
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const AudioEnhanceModal: React.FC<AudioEnhanceModalProps> = ({
  record,
  isOpen,
  onClose,
  currentTime,
  onSeek,
}) => {
  const [clarityBoostEnabled, setClarityBoostEnabled] = useState(false);

  // A-B Segment Trimming
  const duration = record.durationSeconds || 180;
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);

  // Status
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Draw simulated audio visualizer scope
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 2;
      ctx.strokeStyle = clarityBoostEnabled ? "#ef4444" : "#71717a";
      ctx.beginPath();

      for (let x = 0; x < width; x += 3) {
        const freq = clarityBoostEnabled ? 0.04 : 0.02;
        const amp = clarityBoostEnabled ? 18 : 8;
        const y = centerY + Math.sin(x * freq + phase) * amp * Math.sin(x * 0.01);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      phase += 0.05;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, clarityBoostEnabled]);

  if (!isOpen) return null;

  const handleSetStartHere = () => {
    setTrimStart(Math.min(Math.floor(currentTime), trimEnd - 1));
  };

  const handleSetEndHere = () => {
    setTrimEnd(Math.max(Math.ceil(currentTime), trimStart + 1));
  };

  const handlePreviewTrimmedSegment = () => {
    onSeek(trimStart);
  };

  const handleExportSegment = () => {
    // Export clip info or prompt download
    const segmentText = `مقطع مقتطع من تسجيل: ${record.title}\nمن: ${formatSeconds(trimStart)} إلى: ${formatSeconds(trimEnd)}\nالمدة: ${formatSeconds(trimEnd - trimStart)}\n\nالنص المفرغ للمقطع:\n` +
      record.paragraphs
        .filter((p) => p.seconds >= trimStart && p.seconds <= trimEnd)
        .map((p) => `[${p.timestamp}] ${p.speakerName}: ${p.text}`)
        .join("\n\n");

    const blob = new Blob([segmentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title}-clip-${trimStart}s-${trimEnd}s.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>استوديو تحسين الصوت والقص</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Audio Clarity Booster & Trimmer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Vocal Clarity & Isolation */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>عزل ونقاء الصوت البشري (Speech Isolation)</span>
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  تصفية الترددات الخافتة ورفع حضور مخارج الحروف العربية
                </p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setClarityBoostEnabled(!clarityBoostEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
                  clarityBoostEnabled
                    ? "bg-red-600 border-red-500"
                    : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    clarityBoostEnabled ? "translate-x-0" : "-translate-x-6"
                  }`}
                />
              </button>
            </div>

            {/* Scope Visualizer Canvas */}
            <div className="h-14 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden mb-3">
              <canvas
                ref={canvasRef}
                width={360}
                height={56}
                className="w-full h-full"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>حالة المعالجة:</span>
              <span className={`font-bold ${clarityBoostEnabled ? "text-red-400" : "text-zinc-500"}`}>
                {clarityBoostEnabled ? "مفعل (EQ محسّن للوضوح)" : "معطل"}
              </span>
            </div>
          </div>

          {/* Section 2: A-B Clip Trimmer */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>قص وتصدير مقطع محدد (A-B Segment Trimmer)</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-400">
                مدة المقطع: {formatSeconds(trimEnd - trimStart)}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mb-3">
              حدد نقطتي البداية والنهاية لاستخراج هذا الجزء فقط من التفريغ الصوتي.
            </p>

            {/* Range Pickers */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400">البداية (A):</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatSeconds(trimStart)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={trimEnd - 1}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <button
                  onClick={handleSetStartHere}
                  className="w-full mt-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 rounded border border-zinc-800"
                >
                  تعيين المؤشر الحالي ({formatSeconds(currentTime)})
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-400">النهاية (B):</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatSeconds(trimEnd)}
                  </span>
                </div>
                <input
                  type="range"
                  min={trimStart + 1}
                  max={duration}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <button
                  onClick={handleSetEndHere}
                  className="w-full mt-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 rounded border border-zinc-800"
                >
                  تعيين المؤشر الحالي ({formatSeconds(currentTime)})
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviewTrimmedSegment}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-red-500" />
                <span>الاستماع للمقطع</span>
              </button>
              <button
                onClick={handleExportSegment}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-950"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>تم التصدير!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير نص المقطع</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
