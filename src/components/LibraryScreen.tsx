import React, { useState, useMemo } from "react";
import {
  Search,
  FolderKanban,
  Tag,
  Clock,
  Trash2,
  Download,
  Users,
  Plus,
  FileText,
  FileCode,
  FileEdit,
  CheckCircle2,
} from "lucide-react";
import { TranscriptionRecord, Category } from "../types";
import { triggerDownload, generateTXT, generateSRT, generateWordHTML, triggerPrintPDF } from "../utils/exportUtils";

interface LibraryScreenProps {
  recordings: TranscriptionRecord[];
  onSelectRecord: (record: TranscriptionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewRecording: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  recordings,
  onSelectRecord,
  onDeleteRecord,
  onNewRecording,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "الكل">("الكل");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [exportMenuOpenId, setExportMenuOpenId] = useState<string | null>(null);

  const categories: (Category | "الكل")[] = [
    "الكل",
    "محاضرة",
    "مقابلة",
    "اجتماع عمل",
    "محتوى",
    "ملاحظة سريعة",
  ];

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    recordings.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [recordings]);

  // Filtered recordings
  const filteredRecordings = useMemo(() => {
    return recordings.filter((r) => {
      // Category filter
      if (selectedCategory !== "الكل" && r.category !== selectedCategory) {
        return false;
      }
      // Tag filter
      if (selectedTag && !r.tags?.includes(selectedTag)) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSummary = r.summary?.toLowerCase().includes(q);
        const matchesSpeaker = r.speakers?.some((s) => s.name.toLowerCase().includes(q));
        const matchesParagraph = r.paragraphs?.some((p) => p.text.toLowerCase().includes(q));
        const matchesTag = r.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesTitle || matchesSummary || matchesSpeaker || matchesParagraph || matchesTag;
      }
      return true;
    });
  }, [recordings, selectedCategory, selectedTag, searchQuery]);

  const handleQuickExport = (e: React.MouseEvent, record: TranscriptionRecord, type: "pdf" | "word" | "srt" | "txt") => {
    e.stopPropagation();
    setExportMenuOpenId(null);
    const safeTitle = record.title.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 35);
    if (type === "pdf") {
      triggerPrintPDF(record);
    } else if (type === "word") {
      const content = generateWordHTML(record);
      triggerDownload(content, `${safeTitle}.doc`, "application/msword;charset=utf-8");
    } else if (type === "srt") {
      const content = generateSRT(record);
      triggerDownload(content, `${safeTitle}.srt`, "text/plain;charset=utf-8");
    } else if (type === "txt") {
      const content = generateTXT(record);
      triggerDownload(content, `${safeTitle}.txt`, "text/plain;charset=utf-8");
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto">
      {/* Header with Title & Count */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <FolderKanban className="w-4 h-4 text-red-500" />
            مكتبة التسجيلات
          </h1>
          <p className="text-[11px] text-zinc-400">إدارة وتصفح وتصدير كافة المحادثات والمحاضرات</p>
        </div>
        <button
          onClick={onNewRecording}
          className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-red-950/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في العناوين، أسماء المتحدثين، أو النص..."
          className="w-full pl-3 pr-9 py-2 bg-zinc-950 border border-zinc-900 focus:border-red-500 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute left-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            مسح
          </button>
        )}
      </div>

      {/* Folders / Categories Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-semibold ${
                isSelected
                  ? "bg-red-600 text-white border border-red-500 shadow-sm"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-900"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Tags Filter Strip if available */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-[11px]">
          <span className="text-zinc-500 flex items-center gap-0.5 whitespace-nowrap pl-1 text-[10px]">
            <Tag className="w-3 h-3 text-red-500" /> وسوم:
          </span>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2 py-0.5 rounded-lg whitespace-nowrap border text-[10px] transition-colors ${
                  isSelected
                    ? "bg-red-950/80 text-red-300 border-red-500 font-bold"
                    : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 border-zinc-900"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Recordings List */}
      <div className="space-y-3">
        {filteredRecordings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-zinc-900">
            <FolderKanban className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-zinc-300 mb-1">لا توجد تسجيلات مطابقة للبحث</h3>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto mb-3">
              جرّب تغيير كلمات البحث أو تصفية التصنيفات، أو ابدأ تسجيلاً جديداً الآن.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("الكل");
                setSelectedTag(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          filteredRecordings.map((record) => {
            const isMenuOpen = exportMenuOpenId === record.id;
            return (
              <div
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-900 hover:border-red-600/30 transition-all cursor-pointer relative group"
              >
                {/* Top Row: Title, Date, & Actions */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {record.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>{record.createdAt}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        {record.durationFormatted}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 bg-zinc-900 rounded text-zinc-300 border border-zinc-800 text-[9px]">
                        {record.category}
                      </span>
                    </div>
                  </div>

                  {/* Export and Delete Action Buttons */}
                  <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setExportMenuOpenId(isMenuOpen ? null : record.id)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="تصدير سريع"
                    >
                      <Download className="w-3.5 h-3.5 text-red-500" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1.5 rounded-lg hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                      title="حذف التسجيل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Export Popup Menu */}
                    {isMenuOpen && (
                      <div className="absolute left-0 top-8 z-30 w-36 py-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
                        <button
                          onClick={(e) => handleQuickExport(e, record, "pdf")}
                          className="w-full px-3 py-1.5 text-right text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <FileText className="w-3 h-3 text-red-500" />
                          <span>تصدير PDF</span>
                        </button>
                        <button
                          onClick={(e) => handleQuickExport(e, record, "word")}
                          className="w-full px-3 py-1.5 text-right text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <FileEdit className="w-3 h-3 text-blue-500" />
                          <span>تصدير Word</span>
                        </button>
                        <button
                          onClick={(e) => handleQuickExport(e, record, "srt")}
                          className="w-full px-3 py-1.5 text-right text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <FileCode className="w-3 h-3 text-green-500" />
                          <span>ملف ترجمة SRT</span>
                        </button>
                        <button
                          onClick={(e) => handleQuickExport(e, record, "txt")}
                          className="w-full px-3 py-1.5 text-right text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <FileText className="w-3 h-3 text-zinc-400" />
                          <span>نص خام TXT</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Sneak Peek */}
                {record.summary && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
                    {record.summary}
                  </p>
                )}

                {/* Bottom Metadata Badges */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px]">
                  {/* Speakers preview */}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-zinc-500" />
                    <div className="flex -space-x-1 rtl:space-x-reverse">
                      {record.speakers.map((spk, idx) => (
                        <span
                          key={spk.id}
                          className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center border border-black text-white"
                          style={{ backgroundColor: spk.color || (idx === 0 ? "#ef4444" : "#f97316") }}
                          title={spk.name}
                        >
                          {spk.name.charAt(0)}
                        </span>
                      ))}
                    </div>
                    <span className="text-zinc-400 text-[10px] mr-1">
                      {record.speakers.length} {record.speakers.length === 1 ? "متحدث" : "متحدثين"}
                    </span>
                  </div>

                  {/* Sentiment & Action Items count */}
                  <div className="flex items-center gap-2">
                    {record.actionItems?.length > 0 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 rounded text-zinc-300 border border-zinc-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-red-500" />
                        <span>{record.actionItems.length} مهام</span>
                      </span>
                    )}
                    {record.sentiment?.label && (
                      <span className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-800/40 font-medium">
                        {record.sentiment.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
