import React, { useState } from "react";
import {
  GitFork,
  Sparkles,
  X,
  RotateCcw,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Flame,
} from "lucide-react";
import { TranscriptionRecord, MindMapData } from "../types";

interface MindMapModalProps {
  record: TranscriptionRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMindMap: (mindMap: MindMapData) => void;
}

export const MindMapModal: React.FC<MindMapModalProps> = ({
  record,
  isOpen,
  onClose,
  onUpdateMindMap,
}) => {
  const [mindMap, setMindMap] = useState<MindMapData | undefined>(record.mindMap);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateMindMap = async () => {
    setIsLoading(true);
    try {
      const fullTranscript = record.paragraphs
        .map((p) => `${p.speakerName}: ${p.text}`)
        .join("\n");
      const res = await fetch("/api/gemini/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          title: record.title,
        }),
      });
      const data = await res.json();
      if (data.mindMap) {
        setMindMap(data.mindMap);
        onUpdateMindMap(data.mindMap);
      }
    } catch (err) {
      console.error("Mind map error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOutline = () => {
    if (!mindMap) return;
    let text = `# الخريطة الذهنية: ${mindMap.centralTheme}\n\n`;
    mindMap.branches.forEach((b) => {
      text += `## ${b.title}\n`;
      b.items.forEach((item) => {
        text += `- ${item}\n`;
      });
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const branchColors = [
    { border: "border-red-500", bg: "bg-red-950/40", text: "text-red-400", dot: "bg-red-500" },
    { border: "border-amber-500", bg: "bg-amber-950/40", text: "text-amber-400", dot: "bg-amber-500" },
    { border: "border-emerald-500", bg: "bg-emerald-950/40", text: "text-emerald-400", dot: "bg-emerald-500" },
    { border: "border-blue-500", bg: "bg-blue-950/40", text: "text-blue-400", dot: "bg-blue-500" },
    { border: "border-purple-500", bg: "bg-purple-950/40", text: "text-purple-400", dot: "bg-purple-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>الخريطة الذهنية التفاعلية</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900">
                  Visual Mind Map
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">{record.title}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {mindMap && (
              <>
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.1))}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-zinc-400 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopyOutline}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ كنص"}</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateMindMap}
              disabled={isLoading}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-red-950 transition-colors"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>{mindMap ? "إعادة التوليد" : "توليد الخريطة"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:16px_16px]">
          {!mindMap && !isLoading ? (
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-red-500 mx-auto flex items-center justify-center mb-3 shadow-xl">
                <GitFork className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                توليد خريطة ذهنية مرئية
              </h4>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                يقوم محرك الذكاء الاصطناعي بربط المفاهيم الأساسية، الفروع والمحاور من التفريغ الصوتي في مخطط هيكلي مرئي.
              </p>
              <button
                onClick={handleGenerateMindMap}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>إنشاء الخريطة الذهنية الآن</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-zinc-300 font-semibold">
                جارٍ بناء الخريطة الذهنية وربط المحاور...
              </p>
              <span className="text-[10px] text-zinc-500">Gemini AI Engine</span>
            </div>
          ) : (
            <div
              className="w-full transition-transform duration-200 origin-center flex flex-col items-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Central Hub Node */}
              <div className="relative mb-8 text-center">
                <div className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white font-black text-sm sm:text-base shadow-xl shadow-red-950 border border-red-400/40 inline-flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>{mindMap?.centralTheme || record.title}</span>
                </div>
                <div className="w-0.5 h-6 bg-red-500/50 mx-auto" />
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
                {mindMap?.branches.map((branch, index) => {
                  const style = branchColors[index % branchColors.length];
                  return (
                    <div
                      key={branch.id || index}
                      className={`p-4 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between`}
                    >
                      <div>
                        {/* Branch Title */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`} />
                          <h4 className={`text-xs font-black ${style.text}`}>
                            {branch.title}
                          </h4>
                        </div>

                        {/* Branch Leaves (Sub-items) */}
                        <div className="space-y-1.5">
                          {branch.items.map((item, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 text-xs leading-relaxed flex items-start gap-2"
                            >
                              <span className="text-zinc-500 font-mono text-[10px] mt-0.5">•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>المحور {index + 1}</span>
                        <span>{branch.items.length} نقاط</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
