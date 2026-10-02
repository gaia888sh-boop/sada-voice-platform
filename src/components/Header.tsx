import React from "react";
import { Flame, Ear, Sparkles, Download } from "lucide-react";
import { RecordingMode } from "../types";

interface HeaderProps {
  currentTab?: string;
  activeTab?: string;
  onNavigateHome?: () => void;
  onOpenDeafMode: () => void;
  onOpenGitHubModal?: () => void;
  selectedMode?: RecordingMode;
  onSelectMode?: (mode: RecordingMode) => void;
  hasGeminiKey?: boolean;
  recordingsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeafMode,
  onOpenGitHubModal,
  hasGeminiKey = true,
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
          {/* GitHub Publish Button */}
          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs font-semibold cursor-pointer"
              title="نشر المشروع إلى GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </button>
          )}

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
