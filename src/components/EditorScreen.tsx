import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Languages,
  Wand2,
  FileText,
  FileCode,
  Download,
  Users,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Printer,
  MessageSquare,
  GitFork,
  GraduationCap,
  Search,
  Star,
  X,
} from "lucide-react";
import { TranscriptionRecord, Paragraph, ActionItem } from "../types";
import { formatSeconds } from "../utils/audioUtils";
import {
  generateSRT,
  generateVTT,
  generateTXT,
  generateWordHTML,
  getPureTranscribedText,
  triggerDownload,
  triggerPrintPDF,
} from "../utils/exportUtils";
import { RecordingChatModal } from "./RecordingChatModal";
import { MindMapModal } from "./MindMapModal";
import { StudyPackModal } from "./StudyPackModal";
import { AudioEnhanceModal } from "./AudioEnhanceModal";
import { ChaptersList } from "./ChaptersList";

interface EditorScreenProps {
  record: TranscriptionRecord;
  onUpdateRecord: (updated: TranscriptionRecord) => void;
  onBack: () => void;
}

type AITab = "summary" | "chapters" | "sentiment" | "rewrite" | "translate" | "export";

export const EditorScreen: React.FC<EditorScreenProps> = ({
  record,
  onUpdateRecord,
  onBack,
}) => {
  // Active AI Tool Tab
  const [activeAITab, setActiveAITab] = useState<AITab>("summary");

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimerRef = useRef<any>(null);

  // Speaker Filtering & Editing
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<string | null>(null);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState("");

  // AI Operation States
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiStatusMessage, setAIStatusMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Rewrite Tool State
  const [selectedRewriteStyle, setSelectedRewriteStyle] = useState<string>("official");
  const [rewrittenOutput, setRewrittenOutput] = useState<string>("");

  // Translate Tool State
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [translatedOutput, setTranslatedOutput] = useState<string>("");

  // Title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(record.title);

  // Advanced Feature Modals State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isStudyPackOpen, setIsStudyPackOpen] = useState(false);
  const [isAudioEnhanceOpen, setIsAudioEnhanceOpen] = useState(false);

  // In-Transcript Search State
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState("");

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current && record.audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          startSimulatedPlayback();
        });
      }
    } else {
      if (isPlaying) {
        clearInterval(playbackTimerRef.current);
        setIsPlaying(false);
      } else {
        startSimulatedPlayback();
      }
    }
  };

  const startSimulatedPlayback = () => {
    setIsPlaying(true);
    const maxSec = record.durationSeconds || 180;
    playbackTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= maxSec) {
          clearInterval(playbackTimerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current && record.audioUrl) {
      audioRef.current.currentTime = seconds;
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Update paragraph text
  const handleParagraphChange = (pId: string, newText: string) => {
    const updated = {
      ...record,
      paragraphs: record.paragraphs.map((p) => (p.id === pId ? { ...p, text: newText } : p)),
    };
    onUpdateRecord(updated);
  };

  // Delete a paragraph
  const handleDeleteParagraph = (pId: string) => {
    if (record.paragraphs.length <= 1) return;
    const updated = {
      ...record,
      paragraphs: record.paragraphs.filter((p) => p.id !== pId),
    };
    onUpdateRecord(updated);
  };

  // Add new paragraph
  const handleAddParagraph = () => {
    const lastP = record.paragraphs[record.paragraphs.length - 1];
    const newSeconds = lastP ? lastP.seconds + 15 : 0;
    const newP: Paragraph = {
      id: "p-" + Date.now(),
      speakerId: record.speakers[0]?.id || "spk-1",
      speakerName: record.speakers[0]?.name || "متحدث 1",
      timestamp: formatSeconds(newSeconds),
      seconds: newSeconds,
      text: "فقرة جديدة تم إضافتها يدويّاً...",
    };
    const updated = {
      ...record,
      paragraphs: [...record.paragraphs, newP],
    };
    onUpdateRecord(updated);
  };

  // Save speaker name change
  const handleSaveSpeakerName = (speakerId: string) => {
    if (!editingSpeakerName.trim()) {
      setEditingSpeakerId(null);
      return;
    }
    const updatedSpeakers = record.speakers.map((s) =>
      s.id === speakerId ? { ...s, name: editingSpeakerName } : s
    );
    const updatedParagraphs = record.paragraphs.map((p) =>
      p.speakerId === speakerId ? { ...p, speakerName: editingSpeakerName } : p
    );
    const updated = {
      ...record,
      speakers: updatedSpeakers,
      paragraphs: updatedParagraphs,
    };
    onUpdateRecord(updated);
    setEditingSpeakerId(null);
  };

  // Toggle Action item
  const handleToggleAction = (actId: string) => {
    const updated = {
      ...record,
      actionItems: record.actionItems.map((act) =>
        act.id === actId ? { ...act, done: !act.done } : act
      ),
    };
    onUpdateRecord(updated);
  };

  // Add Action item
  const handleAddActionItem = () => {
    const text = prompt("أدخل نص المهمة الجديدة:");
    if (!text?.trim()) return;
    const newAct: ActionItem = {
      id: "act-" + Date.now(),
      text: text.trim(),
      done: false,
      priority: "medium",
    };
    const updated = {
      ...record,
      actionItems: [...(record.actionItems || []), newAct],
    };
    onUpdateRecord(updated);
  };

  // AI Auto-Punctuation & Correction
  const handleAIPunctuate = async () => {
    setIsAIProcessing(true);
    setAIStatusMessage("جارٍ تطبيق علامات الترقيم وتصحيح الصياغة...");
    try {
      const fullText = record.paragraphs.map((p) => p.text).join("\n\n");
      const res = await fetch("/api/gemini/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      });
      const data = await res.json();
      if (data.correctedText) {
        const splitText = data.correctedText.split("\n\n");
        const updatedParagraphs = record.paragraphs.map((p, idx) => ({
          ...p,
          text: splitText[idx] || p.text,
        }));
        onUpdateRecord({ ...record, paragraphs: updatedParagraphs });
      }
    } catch (err) {
      console.error("Auto punctuation failed:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // AI Re-Analyze Summary & Actions
  const handleAIRegenerateAnalysis = async () => {
    setIsAIProcessing(true);
    setAIStatusMessage("جارٍ استخراج الملخص التنفيذي والمهام...");
    try {
      const fullText = record.paragraphs.map((p) => `[${p.speakerName}]: ${p.text}`).join("\n");
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, title: record.title }),
      });
      const data = await res.json();
      if (data.summary) {
        onUpdateRecord({
          ...record,
          summary: data.summary,
          keyPoints: data.keyPoints || record.keyPoints,
          actionItems: data.actionItems?.length
            ? data.actionItems.map((item: any, idx: number) => ({
                id: `act-${Date.now()}-${idx}`,
                text: typeof item === "string" ? item : item.text,
                done: false,
                priority: item.priority || "medium",
              }))
            : record.actionItems,
          sentiment: data.sentiment || record.sentiment,
        });
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // AI Rewrite
  const handleAIRewrite = async () => {
    setIsAIProcessing(true);
    setAIStatusMessage("جارٍ إعادة الصياغة بالأسلوب المختار...");
    try {
      const fullText = record.paragraphs.map((p) => p.text).join("\n\n");
      const res = await fetch("/api/gemini/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, style: selectedRewriteStyle }),
      });
      const data = await res.json();
      if (data.rewrittenText) {
        setRewrittenOutput(data.rewrittenText);
      }
    } catch (err) {
      console.error("Rewrite error:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // AI Translate
  const handleAITranslate = async () => {
    setIsAIProcessing(true);
    setAIStatusMessage("جارٍ الترجمة الفورية...");
    try {
      const fullText = record.paragraphs.map((p) => `[${p.speakerName}]: ${p.text}`).join("\n\n");
      const res = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, targetLanguage }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedOutput(data.translatedText);
      }
    } catch (err) {
      console.error("Translate error:", err);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Filtered paragraphs by selected speaker
  const visibleParagraphs = selectedSpeakerFilter
    ? record.paragraphs.filter((p) => p.speakerId === selectedSpeakerFilter)
    : record.paragraphs;

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto">
      {/* Top Bar with Back Button & Category */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمكتبة</span>
        </button>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/40">
          {record.category}
        </span>
      </div>

      {/* Editable Document Title */}
      <div className="mb-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-red-500 rounded-xl text-xs font-bold text-white focus:outline-none"
            />
            <button
              onClick={() => {
                onUpdateRecord({ ...record, title: currentTitle });
                setIsEditingTitle(false);
              }}
              className="px-2.5 py-1.5 bg-red-600 rounded-xl text-xs text-white font-bold"
            >
              حفظ
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between group">
            <h1 className="text-sm font-black text-white leading-tight">{record.title}</h1>
            <button
              onClick={() => {
                setCurrentTitle(record.title);
                setIsEditingTitle(true);
              }}
              className="p-1 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="تعديل العنوان"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>{record.createdAt}</span>
            <span>•</span>
            <span className="font-mono text-zinc-300">{record.durationFormatted}</span>
            <span>•</span>
            <span>{record.paragraphs.length} فقرات</span>
          </div>
          <button
            onClick={() => onUpdateRecord({ ...record, starred: !record.starred })}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              record.starred
                ? "bg-amber-950/60 border-amber-500/80 text-amber-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title={record.starred ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Star className={`w-3.5 h-3.5 ${record.starred ? "fill-amber-400" : ""}`} />
            <span className="text-[10px] font-semibold hidden sm:inline">
              {record.starred ? "مفضل" : "تفضيل"}
            </span>
          </button>
        </div>
      </div>

      {/* Advanced AI Capabilities Quick Bar */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {/* Ask Audio Recording AI Chat */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-br from-red-950/60 to-zinc-900 border border-red-500/40 hover:border-red-500 text-center group transition-all duration-200 shadow-md shadow-red-950/20"
        >
          <div className="w-7 h-7 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-white leading-tight">اسأل التسجيل</div>
          <div className="text-[9px] text-red-400 font-semibold mt-0.5">دردشة ذكية</div>
        </button>

        {/* Mind Map */}
        <button
          onClick={() => setIsMindMapOpen(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-amber-500/60 text-center group transition-all duration-200 shadow-md"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <GitFork className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-white leading-tight">خريطة ذهنية</div>
          <div className="text-[9px] text-zinc-400 mt-0.5">ربط المفاهيم</div>
        </button>

        {/* Study Pack */}
        <button
          onClick={() => setIsStudyPackOpen(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-emerald-500/60 text-center group transition-all duration-200 shadow-md"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-white leading-tight">حزمة استذكار</div>
          <div className="text-[9px] text-zinc-400 mt-0.5">بطاقات واختبار</div>
        </button>

        {/* Audio Studio & Trimmer */}
        <button
          onClick={() => setIsAudioEnhanceOpen(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-blue-500/60 text-center group transition-all duration-200 shadow-md"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-white leading-tight">تحسين وقص</div>
          <div className="text-[9px] text-zinc-400 mt-0.5">نقاء وعزل</div>
        </button>
      </div>

      {/* Audio Player Controller Bar */}
      <div className="p-3 mb-4 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-md">
        {record.audioUrl && (
          <audio
            ref={audioRef}
            src={record.audioUrl}
            onTimeUpdate={(e) => setCurrentTime(Math.floor(e.currentTarget.currentTime))}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-950/60"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white mr-0.5" />}
            </button>
            <button
              onClick={() => seekTo(0)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="إعادة التشغيل من البداية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-zinc-300 font-bold">
              {formatSeconds(currentTime)} / {record.durationFormatted}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
            {[1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition-colors ${
                  playbackSpeed === spd ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seekTo(Math.floor(pos * (record.durationSeconds || 180)));
          }}
          className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer"
        >
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all"
            style={{
              width: `${Math.min(100, (currentTime / (record.durationSeconds || 180)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Speaker Diarization Section */}
      <div className="mb-4 p-3 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-500" />
            المتحدثون (Diarization)
          </span>
          {selectedSpeakerFilter && (
            <button
              onClick={() => setSelectedSpeakerFilter(null)}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              عرض الجميع
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.speakers.map((speaker, idx) => {
            const isEditing = editingSpeakerId === speaker.id;
            const isFilterActive = selectedSpeakerFilter === speaker.id;
            return (
              <div key={speaker.id} className="relative">
                {isEditing ? (
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-red-500">
                    <input
                      type="text"
                      value={editingSpeakerName}
                      onChange={(e) => setEditingSpeakerName(e.target.value)}
                      className="px-2 py-0.5 bg-black rounded text-xs text-white w-24 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveSpeakerName(speaker.id)}
                      className="px-1.5 py-0.5 bg-red-600 rounded text-[10px] text-white font-bold"
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      setSelectedSpeakerFilter(isFilterActive ? null : speaker.id)
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition-all ${
                      isFilterActive
                        ? "bg-red-950/80 border-red-500 text-white font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: speaker.color || (idx === 0 ? "#ef4444" : "#f97316") }}
                    />
                    <span>{speaker.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSpeakerId(speaker.id);
                        setEditingSpeakerName(speaker.name);
                      }}
                      className="text-zinc-500 hover:text-zinc-300 mr-0.5"
                      title="تعديل اسم المتحدث"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Side Tools / Tabs Switcher */}
      <div className="mb-4">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveAITab("summary")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "summary" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>الملخص والمهام</span>
          </button>
          <button
            onClick={() => setActiveAITab("chapters")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "chapters" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>الفصول</span>
          </button>
          <button
            onClick={() => setActiveAITab("sentiment")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "sentiment" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>النبرة والمشاعر</span>
          </button>
          <button
            onClick={() => setActiveAITab("rewrite")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "rewrite" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Wand2 className="w-3 h-3" />
            <span>إعادة صياغة</span>
          </button>
          <button
            onClick={() => setActiveAITab("translate")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "translate" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Languages className="w-3 h-3" />
            <span>ترجمة فورية</span>
          </button>
          <button
            onClick={() => setActiveAITab("export")}
            className={`flex-1 py-1.5 px-2 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeAITab === "export" ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Download className="w-3 h-3" />
            <span>تصدير نقي</span>
          </button>
        </div>
      </div>

      {/* Active AI Tab Content Box */}
      <div className="mb-5 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        {/* Tab 1: Summary & Action Items */}
        {activeAITab === "summary" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                الملخص التنفيذي
              </span>
              <button
                onClick={handleAIRegenerateAnalysis}
                disabled={isAIProcessing}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة التحليل</span>
              </button>
            </div>

            {/* Executive Summary */}
            <div className="p-3 bg-zinc-900/90 rounded-xl text-xs text-zinc-200 leading-relaxed mb-3 border border-zinc-800">
              {record.summary || "لا يوجد ملخص متوفر حالياً."}
            </div>

            {/* Key Points */}
            {record.keyPoints?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-[11px] font-bold text-zinc-400 mb-1">النقاط الجوهرية (Key Takeaways):</h4>
                <ul className="space-y-1">
                  {record.keyPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Action Items Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-bold text-zinc-400">المهام والتوصيات (Action Items):</h4>
                <button
                  onClick={handleAddActionItem}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة مهمة</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {record.actionItems?.length ? (
                  record.actionItems.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAction(act.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        act.done
                          ? "bg-zinc-950 border-zinc-900 text-zinc-500 line-through"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            act.done
                              ? "bg-red-600 border-red-500 text-white"
                              : "border-zinc-700 bg-zinc-800"
                          }`}
                        >
                          {act.done && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs">{act.text}</span>
                      </div>
                      {act.priority && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            act.priority === "high"
                              ? "bg-red-950 text-red-400"
                              : act.priority === "medium"
                              ? "bg-amber-950 text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {act.priority === "high" ? "عالية" : "متوسطة"}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">لا توجد مهام مستخرجة.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Smart Chaptering */}
        {activeAITab === "chapters" && (
          <ChaptersList
            record={record}
            currentTime={currentTime}
            onSeek={seekTo}
            onUpdateChapters={(newChapters) => {
              onUpdateRecord({ ...record, chapters: newChapters });
            }}
          />
        )}

        {/* Tab 3: Sentiment & Tone Analysis */}
        {activeAITab === "sentiment" && (
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
              تحليل المشاعر والنبرة (Sentiment & Tone)
            </span>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400">الحالة العامة</span>
                <div className="text-sm font-black text-red-400 mt-0.5">
                  {record.sentiment?.label || "إيجابي"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400">مؤشر الثقة والوضوح</span>
                <div className="text-sm font-black text-white mt-0.5 font-mono">
                  {record.sentiment?.score || 90}%
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-3">
              <span className="text-[10px] text-zinc-400">وصف النبرة:</span>
              <p className="text-xs text-zinc-200 mt-1 font-medium leading-relaxed">
                {record.sentiment?.toneDescription || "نبرة مهنية واضحة ومتوازنة."}
              </p>
            </div>
            {/* Detected Keywords */}
            {record.sentiment?.keywords?.length > 0 && (
              <div>
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 mb-1.5">
                  <Tag className="w-3 h-3 text-red-500" />
                  الكلمات المفتاحية الأكثر تكراراً:
                </span>
                <div className="flex flex-wrap gap-1">
                  {record.sentiment.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Smart Rewrite */}
        {activeAITab === "rewrite" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-red-500" />
                إعادة صياغة النص الذكية
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs">
              {[
                { id: "official", label: "أسلوب رسمي مهني" },
                { id: "academic", label: "أسلوب أكاديمي محكم" },
                { id: "content_creator", label: "منشور جذاب للسوشيال ميديا" },
                { id: "casual", label: "أسلوب عفوي مبسط" },
                { id: "medical_clinical", label: "تقرير طبي منظم (SOAP)" },
                { id: "bullet_summary", label: "نقاط موجزة سريعة" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedRewriteStyle(style.id)}
                  className={`p-2 rounded-xl border text-right transition-colors ${
                    selectedRewriteStyle === style.id
                      ? "bg-red-950/80 border-red-500 text-white font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAIRewrite}
              disabled={isAIProcessing}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 mb-3 transition-colors shadow-md shadow-red-950/50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>إعادة الصياغة الآن</span>
            </button>
            {rewrittenOutput && (
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-red-400 font-bold">النص المعاد صياغته:</span>
                  <button
                    onClick={() => handleCopy(rewrittenOutput, "rewrite")}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                  >
                    {copiedKey === "rewrite" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "rewrite" ? "تم النسخ" : "نسخ"}</span>
                  </button>
                </div>
                <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {rewrittenOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Instant Translation */}
        {activeAITab === "translate" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-red-500" />
                الترجمة الفورية للنص المفرغ
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="en">الإنجليزية (English)</option>
                <option value="fr">الفرنسية (Français)</option>
                <option value="es">الإسبانية (Español)</option>
                <option value="de">الألمانية (Deutsch)</option>
                <option value="tr">التركية (Türkçe)</option>
                <option value="ur">الأوردية (Urdu)</option>
                <option value="zh">الصينية (Chinese)</option>
              </select>
              <button
                onClick={handleAITranslate}
                disabled={isAIProcessing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>ترجمة</span>
              </button>
            </div>
            {translatedOutput && (
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-red-400 font-bold">النص المترجم:</span>
                  <button
                    onClick={() => handleCopy(translatedOutput, "trans")}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                  >
                    {copiedKey === "trans" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "trans" ? "تم النسخ" : "نسخ"}</span>
                  </button>
                </div>
                <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-left" dir="ltr">
                  {translatedOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Smart Export - Pure Transcribed Text */}
        {activeAITab === "export" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-red-500" />
                تصدير النص المفرغ الصافي فقط
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                نص نقي بدون إضافات
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              تحميل وتصدير <strong className="text-zinc-200">الكلام المنطوق الفعلي فقط</strong> بدون أي ملخصات أو مهام لتسهيل النشر أو اللصق.
            </p>

            {/* Live Text Preview Box */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                <span className="font-semibold text-zinc-300">معاينة النص الصافي:</span>
                <span className="font-mono text-zinc-500">
                  {getPureTranscribedText(record).split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              <div className="max-h-28 overflow-y-auto text-xs text-zinc-300 leading-relaxed p-2 bg-black/50 rounded-lg border border-zinc-900 select-text whitespace-pre-wrap">
                {getPureTranscribedText(record) || (
                  <span className="text-zinc-500 italic">لا يوجد نص مفرغ حتى الآن</span>
                )}
              </div>
            </div>

            {/* Export Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* TXT */}
              <button
                onClick={() => {
                  const content = generateTXT(record);
                  triggerDownload(content, `${record.title}.txt`, "text/plain;charset=utf-8");
                }}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-right flex flex-col justify-between group transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-white group-hover:text-red-400 transition-colors">مستند نصي (TXT)</span>
                  <FileText className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-400">نص نقي 100%</span>
              </button>

              {/* Word */}
              <button
                onClick={() => {
                  const content = generateWordHTML(record);
                  triggerDownload(content, `${record.title}.doc`, "application/msword;charset=utf-8");
                }}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-right flex flex-col justify-between group transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-white group-hover:text-blue-400 transition-colors">مستند Word (.doc)</span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] text-zinc-400">منسق للطباعة</span>
              </button>

              {/* PDF */}
              <button
                onClick={() => triggerPrintPDF(record)}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-right flex flex-col justify-between group transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-white group-hover:text-red-400 transition-colors">طباعة / حفظ PDF</span>
                  <Printer className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[10px] text-zinc-400">تجهيز فوري للطباعة</span>
              </button>

              {/* Instant Copy to Clipboard */}
              <button
                onClick={() => {
                  const text = getPureTranscribedText(record);
                  handleCopy(text, "pure-text-export");
                }}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-right flex flex-col justify-between group transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-white group-hover:text-amber-400 transition-colors">نسخ النص كاملاً</span>
                  {copiedKey === "pure-text-export" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">
                  {copiedKey === "pure-text-export" ? "تم النسخ للحافظة!" : "نسخ إلى الحافظة بنقرة واحدة"}
                </span>
              </button>

              {/* SRT Subtitle */}
              <button
                onClick={() => {
                  const content = generateSRT(record);
                  triggerDownload(content, `${record.title}.srt`, "text/plain;charset=utf-8");
                }}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-right flex flex-col justify-between transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-zinc-300 text-[11px]">ملف ترجمة SRT</span>
                  <FileCode className="w-3.5 h-3.5 text-green-500" />
                </div>
                <span className="text-[9px] text-zinc-500">مع التوقيتات لليوتيوب</span>
              </button>

              {/* VTT Subtitle */}
              <button
                onClick={() => {
                  const content = generateVTT(record);
                  triggerDownload(content, `${record.title}.vtt`, "text/vtt;charset=utf-8");
                }}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-right flex flex-col justify-between transition-colors"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-zinc-300 text-[11px]">ترجمة WebVTT</span>
                  <FileCode className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <span className="text-[9px] text-zinc-500">لمشغلات الويب HTML5</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Paragraphs & Transcript Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">النص المفرغ والفقرات</span>
            <span className="text-[10px] text-zinc-500">({visibleParagraphs.length} فقرة)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAIPunctuate}
              disabled={isAIProcessing}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800 rounded-lg text-[10px] font-semibold flex items-center gap-1"
              title="تصحيح الترقيم بالذكاء الاصطناعي"
            >
              <Sparkles className="w-3 h-3" />
              <span>ضبط الترقيم</span>
            </button>
            <button
              onClick={handleAddParagraph}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg text-[10px] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة فقرة</span>
            </button>
          </div>
        </div>

        {/* In-Transcript Live Search Bar */}
        <div className="mb-3">
          <div className="relative flex items-center bg-zinc-950 border border-zinc-900 focus-within:border-red-500/80 rounded-xl px-2.5 py-1.5 transition-colors">
            <Search className="w-3.5 h-3.5 text-zinc-500 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={transcriptSearchQuery}
              onChange={(e) => setTranscriptSearchQuery(e.target.value)}
              placeholder="ابحث في نص هذا التسجيل..."
              className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none flex-1"
            />
            {transcriptSearchQuery.trim() && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900/50">
                  {
                    visibleParagraphs.filter((p) =>
                      p.text.toLowerCase().includes(transcriptSearchQuery.toLowerCase())
                    ).length
                  }{" "}
                  نتيجة
                </span>
                <button
                  onClick={() => setTranscriptSearchQuery("")}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paragraphs List */}
        <div className="space-y-3">
          {visibleParagraphs.map((paragraph, index) => {
            const speaker = record.speakers.find((s) => s.id === paragraph.speakerId);
            const isHighlighted =
              currentTime >= paragraph.seconds &&
              (!visibleParagraphs[index + 1] || currentTime < visibleParagraphs[index + 1].seconds);
            const matchesSearch =
              transcriptSearchQuery.trim() &&
              paragraph.text.toLowerCase().includes(transcriptSearchQuery.toLowerCase());

            return (
              <div
                key={paragraph.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  matchesSearch
                    ? "bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-950/30"
                    : isHighlighted
                    ? "bg-red-950/20 border-red-500/80 shadow-md shadow-red-950/30"
                    : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {/* Paragraph Meta Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: speaker?.color || "#ef4444" }}
                    />
                    <span className="text-xs font-bold text-white">{paragraph.speakerName}</span>
                    {/* Clickable timestamp */}
                    <button
                      onClick={() => seekTo(paragraph.seconds)}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 font-mono text-[10px] border border-zinc-800 transition-colors flex items-center gap-1"
                      title="الاستماع لهذه الفقرة"
                    >
                      <Clock className="w-2.5 h-2.5 text-red-500" />
                      <span>[{paragraph.timestamp}]</span>
                    </button>
                    {matchesSearch && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-900 font-semibold">
                        تطابق بحث
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteParagraph(paragraph.id)}
                    className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                    title="حذف هذه الفقرة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Editable Paragraph Text */}
                <textarea
                  value={paragraph.text}
                  onChange={(e) => handleParagraphChange(paragraph.id, e.target.value)}
                  rows={Math.max(2, Math.ceil(paragraph.text.length / 55))}
                  className="w-full bg-transparent text-xs text-zinc-200 leading-relaxed focus:outline-none resize-none selection:bg-red-600 selection:text-white"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Feature Modals */}
      <RecordingChatModal
        record={record}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSeek={seekTo}
        onUpdateChatHistory={(updatedHistory) => {
          onUpdateRecord({ ...record, chatHistory: updatedHistory });
        }}
      />

      <MindMapModal
        record={record}
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
        onUpdateMindMap={(newMindMap) => {
          onUpdateRecord({ ...record, mindMap: newMindMap });
        }}
      />

      <StudyPackModal
        record={record}
        isOpen={isStudyPackOpen}
        onClose={() => setIsStudyPackOpen(false)}
        onUpdateStudyPack={(flashcards, quiz) => {
          onUpdateRecord({ ...record, flashcards, quiz });
        }}
      />

      <AudioEnhanceModal
        record={record}
        isOpen={isAudioEnhanceOpen}
        onClose={() => setIsAudioEnhanceOpen(false)}
        currentTime={currentTime}
        onSeek={seekTo}
      />

      {/* AI Processing Global Toast */}
      {isAIProcessing && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto p-3 bg-zinc-900 border border-red-500/80 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin flex-shrink-0" />
          <span className="text-xs text-zinc-200 font-medium">{aiStatusMessage}</span>
        </div>
      )}
    </div>
  );
};
