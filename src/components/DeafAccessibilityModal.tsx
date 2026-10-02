import React, { useState, useEffect, useRef } from "react";
import {
  Ear,
  X,
  Mic,
  Square,
  ZoomIn,
  ZoomOut,
  Flame,
} from "lucide-react";
import { formatSeconds } from "../utils/audioUtils";

interface DeafAccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dialect: string;
}

export const DeafAccessibilityModal: React.FC<DeafAccessibilityModalProps> = ({
  isOpen,
  onClose,
  dialect,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [fontSize, setFontSize] = useState<number>(26); // default large font size
  const [transcriptLines, setTranscriptLines] = useState<
    { id: string; speaker: string; text: string; time: string }[]
  >([
    {
      id: "1",
      speaker: "المتحدث",
      text: "مرحباً بك في وضع القراءة المباشرة عالي التباين المخصص للصم وضعاف السمع.",
      time: "00:00",
    },
  ]);
  const [currentInterim, setCurrentInterim] = useState("");
  const [visualFlash, setVisualFlash] = useState(false);
  const [soundDetected, setSoundDetected] = useState(false);
  const [speakerCount, setSpeakerCount] = useState(1);
  const recognitionRef = useRef<any>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptLines, currentInterim]);

  const startListening = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = dialect || "ar-SA";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        // Trigger visual flash
        setVisualFlash(true);
        setSoundDetected(true);
        setTimeout(() => setVisualFlash(false), 250);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(60);
        }

        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalText = item[0].transcript.trim();
            if (finalText) {
              setTranscriptLines((prev) => [
                ...prev,
                {
                  id: "line-" + Date.now(),
                  speaker: `المتحدث ${speakerCount}`,
                  text: finalText,
                  time: formatSeconds(Math.floor(Date.now() / 1000) % 3600),
                },
              ]);
            }
          } else {
            interim += item[0].transcript;
          }
        }
        setCurrentInterim(interim);
      };

      recognition.onerror = (err: any) => {
        console.warn("Deaf mode recognition error:", err);
      };

      recognition.onend = () => {
        if (isOpen && isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.warn("Could not start recognition:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black text-white flex flex-col transition-colors duration-200 ${
        visualFlash ? "bg-red-950/30 ring-8 ring-inset ring-red-600" : ""
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950">
            <Ear className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              وضع الصم وضعاف السمع
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </h2>
            <p className="text-[10px] text-zinc-400">نصوص مكبرة فورية مع تنبيهات بصرية واهتزازية</p>
          </div>
        </div>

        {/* Font Size & Close Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setFontSize((s) => Math.max(18, s - 3))}
              className="p-1 text-zinc-400 hover:text-white"
              title="تصغير الخط"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-zinc-300 px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(46, s + 3))}
              className="p-1 text-zinc-400 hover:text-white"
              title="تكبير الخط"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visual Activity Banner */}
      <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              soundDetected ? "bg-red-500 animate-pulse" : "bg-zinc-700"
            }`}
          />
          <span className="text-zinc-300 font-medium">
            {isListening ? "جهاز التقاط الصوت متصل ومفعل..." : "متوقف مؤقتاً"}
          </span>
        </div>
        <button
          onClick={() => setSpeakerCount((c) => (c % 3) + 1)}
          className="text-[11px] text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
        >
          تبديل المتحدث (متحدث {speakerCount})
        </button>
      </div>

      {/* Giant Live Reading Canvas Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {transcriptLines.map((line) => (
          <div
            key={line.id}
            className="p-4 rounded-2xl bg-zinc-950 border-2 border-zinc-800/80 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-900">
              <span className="text-xs font-black text-red-500 tracking-wide">{line.speaker}</span>
              <span className="text-[11px] font-mono text-zinc-500">[{line.time}]</span>
            </div>
            <p
              className="font-bold text-zinc-100 leading-relaxed tracking-wide selection:bg-red-600 selection:text-white"
              style={{ fontSize: `${fontSize}px` }}
            >
              {line.text}
            </p>
          </div>
        ))}

        {/* Current Interim Text Floating in High Contrast */}
        {currentInterim && (
          <div className="p-4 rounded-2xl bg-red-950/30 border-2 border-red-500 shadow-xl shadow-red-950/40 animate-pulse">
            <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-bold">
              <Flame className="w-4 h-4 text-red-500" />
              <span>يُقال الآن:</span>
            </div>
            <p
              className="font-bold text-white leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentInterim}
            </p>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Bottom Floating Control */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isListening
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-950"
              : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          {isListening ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              <span>إيقاف الاستماع</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-red-500" />
              <span>بدء الاستماع المباشر</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
