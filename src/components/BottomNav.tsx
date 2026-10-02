import React from "react";
import { Mic, FolderKanban, FileEdit, Settings } from "lucide-react";

interface BottomNavProps {
  activeTab: "home" | "library" | "editor" | "settings";
  onChangeTab: (tab: "home" | "library" | "editor" | "settings") => void;
  recordingsCount: number;
  hasActiveDocument: boolean;
  isRecordingActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  recordingsCount,
  hasActiveDocument,
  isRecordingActive,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 pb-safe px-4 pt-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Home / Record */}
        <button
          onClick={() => onChangeTab("home")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === "home"
              ? "text-red-500 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <Mic className={`w-5 h-5 ${activeTab === "home" ? "text-red-500 scale-110" : ""}`} />
            {isRecordingActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
            )}
          </div>
          <span className="text-[11px] mt-1">تسجيل</span>
          {activeTab === "home" && (
            <span className="absolute bottom-0 w-6 h-0.5 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Library */}
        <button
          onClick={() => onChangeTab("library")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === "library"
              ? "text-red-500 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <FolderKanban className={`w-5 h-5 ${activeTab === "library" ? "text-red-500 scale-110" : ""}`} />
            {recordingsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-zinc-800 text-zinc-300 text-[9px] rounded-full border border-zinc-700">
                {recordingsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">المكتبة</span>
          {activeTab === "library" && (
            <span className="absolute bottom-0 w-6 h-0.5 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Editor */}
        <button
          onClick={() => onChangeTab("editor")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === "editor"
              ? "text-red-500 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="relative">
            <FileEdit className={`w-5 h-5 ${activeTab === "editor" ? "text-red-500 scale-110" : ""}`} />
            {hasActiveDocument && (
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </div>
          <span className="text-[11px] mt-1">المحرر</span>
          {activeTab === "editor" && (
            <span className="absolute bottom-0 w-6 h-0.5 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => onChangeTab("settings")}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === "settings"
              ? "text-red-500 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === "settings" ? "text-red-500 scale-110" : ""}`} />
          <span className="text-[11px] mt-1">الإعدادات</span>
          {activeTab === "settings" && (
            <span className="absolute bottom-0 w-6 h-0.5 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
