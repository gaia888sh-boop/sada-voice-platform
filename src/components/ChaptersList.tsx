import React, { useState } from "react";
import {
  Bookmark,
  Sparkles,
  Clock,
  RotateCcw,
} from "lucide-react";
import { TranscriptionRecord, Chapter } from "../types";

interface ChaptersListProps {
  record: TranscriptionRecord;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
}

export const ChaptersList: React.FC<ChaptersListProps> = ({
  record,
  currentTime,
  onSeek,
  onUpdateChapters,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(record.chapters || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateChapters = async () => {
    setIsLoading(true);
    try {
      const fullTranscript = record.paragraphs
        .map((p) => `[${p.timestamp}] ${p.speakerName}: ${p.text}`)
        .join("\n");
      const res = await fetch("/api/gemini/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          durationSeconds: record.durationSeconds || 180,
          title: record.title,
        }),
      });
      const data = await res.json();
      if (data.chapters) {
        setChapters(data.chapters);
        onUpdateChapters(data.chapters);
      }
    } catch (err) {
      console.error("Chapters error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-red-500" />
          فصول التسجيل (Chapters)
        </span>
        <button
          onClick={handleGenerateChapters}
          disabled={isLoading}
          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
        >
          <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>{chapters.length ? "تحديث الفصول" : "توليد الفصول الذكية"}</span>
        </button>
      </div>

      {chapters.length === 0 && !isLoading ? (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <Bookmark className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-300 font-semibold mb-1">
            لا توجد فصول مقسمة حالياً
          </p>
          <p className="text-[11px] text-zinc-400 mb-3">
            يقوم الذكاء الاصطناعي بتقسيم التسجيل تلقائياً إلى محطات زمنية رئيسية مع ملخص لكل جزء.
          </p>
          <button
            onClick={handleGenerateChapters}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تقسيم إلى فصول ذكية</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-300 font-semibold">
            جارٍ تحليل التسجيل واستخراج الفصول...
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter, index) => {
            const nextChapter = chapters[index + 1];
            const isCurrentChapter =
              currentTime >= chapter.startSeconds &&
              (!nextChapter || currentTime < nextChapter.startSeconds);
            return (
              <div
                key={chapter.id || index}
                onClick={() => onSeek(chapter.startSeconds)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrentChapter
                    ? "bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/30"
                    : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 ${
                        isCurrentChapter
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>[{chapter.timestamp}]</span>
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      {chapter.title}
                    </h4>
                  </div>
                  {chapter.keyTakeaway && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900/50 font-semibold">
                      {chapter.keyTakeaway}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed pr-6">
                  {chapter.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
