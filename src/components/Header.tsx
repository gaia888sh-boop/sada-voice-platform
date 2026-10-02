import React from "react";
import { Flame, Ear, Sparkles, Download } from "lucide-react";
import { RecordingMode } from "../types";

interface HeaderProps {
  currentTab: string;
  onOpenDeafMode: () => void;
  selectedMode: RecordingMode;
  onSelectMode: (mode: RecordingMode) => void;
  hasGeminiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeafMode,
  hasGeminiKey,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3">
      {/* Mobile Top Status Row */}
      <div className="flex items-center justify-between">
        {/* App Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-950 border border-red-500/40 shadow-lg shadow-red-950/50">
            <Flame className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1 font-['Cairo']">
                صدى
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  AI PRO
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">النسخ الصوتي الذكي وتفريغ الاجتماعات</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Download Project ZIP */}
          <a
            href="/api/download-zip"
            download="sada-voice-platform.zip"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/60 transition-all text-xs font-semibold cursor-pointer"
            title="تحميل كود المشروع كملف مضغوط ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحميل ZIP</span>
          </a>

          {/* Deaf Assistance Mode Quick Launch */}
          <button
            onClick={onOpenDeafMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs font-semibold"
            title="وضع الصم وضعاف السمع"
          >
            <Ear className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">وضع الصم</span>
          </button>

          {/* AI Connection Status Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
              hasGeminiKey
                ? "bg-red-950/40 text-red-300 border-red-800/40"
                : "bg-zinc-900 text-zinc-400 border-zinc-800"
            }`}
          >
            <Sparkles className="w-3 h-3 text-red-500" />
            <span className="hidden xs:inline">Gemini AI</span>
          </div>
        </div>
      </div>
    </header>
  );
};
