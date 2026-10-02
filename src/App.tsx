import React, { useState, useEffect } from "react";
import { TranscriptionRecord, AppSettings } from "./types";
import { initialRecordings, initialSettings } from "./data/initialData";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./components/HomeScreen";
import { LibraryScreen } from "./components/LibraryScreen";
import { EditorScreen } from "./components/EditorScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { DeafAccessibilityModal } from "./components/DeafAccessibilityModal";
import { GitHubPublishModal } from "./components/GitHubPublishModal";

export default function App() {
  // Recordings State with localStorage persistence
  const [recordings, setRecordings] = useState<TranscriptionRecord[]>(() => {
    try {
      const saved = localStorage.getItem("sada_recordings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn("Could not read recordings from localStorage:", err);
    }
    return initialRecordings;
  });

  // App Settings State with localStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("sada_settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn("Could not read settings from localStorage:", err);
    }
    return initialSettings;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<"record" | "library" | "accessibility" | "settings">("record");
  const [activeRecord, setActiveRecord] = useState<TranscriptionRecord | null>(null);

  // Deaf Accessibility Overlay Modal
  const [isDeafModalOpen, setIsDeafModalOpen] = useState(false);

  // GitHub Repository Publisher Overlay Modal
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Persist recordings on update
  useEffect(() => {
    try {
      // Don't persist binary blobs in localStorage
      const storableRecordings = recordings.map((r) => {
        const { audioBlob, ...rest } = r;
        return rest;
      });
      localStorage.setItem("sada_recordings", JSON.stringify(storableRecordings));
    } catch (err) {
      console.warn("Could not save recordings to localStorage:", err);
    }
  }, [recordings]);

  // Persist settings on update
  useEffect(() => {
    try {
      localStorage.setItem("sada_settings", JSON.stringify(settings));
    } catch (err) {
      console.warn("Could not save settings to localStorage:", err);
    }
  }, [settings]);

  // When a new recording finishes
  const handleRecordingCompleted = (newRecord: TranscriptionRecord) => {
    setRecordings((prev) => [newRecord, ...prev]);
    setActiveRecord(newRecord);
  };

  // Update existing record
  const handleUpdateRecord = (updated: TranscriptionRecord) => {
    setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setActiveRecord(updated);
  };

  // Delete recording
  const handleDeleteRecord = (id: string) => {
    if (confirm("هل تريد بالتأكيد حذف هذا التسجيل؟")) {
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      if (activeRecord?.id === id) {
        setActiveRecord(null);
      }
    }
  };

  // Reset demo data
  const handleResetData = () => {
    setRecordings(initialRecordings);
    setSettings(initialSettings);
    setActiveRecord(null);
    localStorage.removeItem("sada_recordings");
    localStorage.removeItem("sada_settings");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white font-['Cairo',sans-serif]"
    >
      {/* Visual flash effect if enabled in settings */}
      {settings.visualAlerts && (
        <div className="fixed inset-0 pointer-events-none border-2 border-red-600/10 z-50" />
      )}

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onNavigateHome={() => {
          setActiveRecord(null);
          setActiveTab("record");
        }}
        onOpenDeafMode={() => setIsDeafModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        recordingsCount={recordings.length}
      />

      {/* Main Dynamic View */}
      <main className="pt-2">
        {activeRecord ? (
          <EditorScreen
            record={activeRecord}
            onUpdateRecord={handleUpdateRecord}
            onBack={() => setActiveRecord(null)}
          />
        ) : activeTab === "record" ? (
          <HomeScreen
            onRecordingCompleted={handleRecordingCompleted}
            onOpenDeafMode={() => setIsDeafModalOpen(true)}
            settings={settings}
            recentRecordings={recordings}
            onSelectRecord={(rec) => setActiveRecord(rec)}
          />
        ) : activeTab === "library" ? (
          <LibraryScreen
            recordings={recordings}
            onSelectRecord={(rec) => setActiveRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
            onNewRecording={() => {
              setActiveRecord(null);
              setActiveTab("record");
            }}
          />
        ) : activeTab === "accessibility" ? (
          <div className="pb-28 pt-4 px-4 max-w-lg mx-auto text-center">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-red-950">
                <span className="text-2xl font-black">👂</span>
              </div>
              <h2 className="text-base font-black text-white mb-1.5">
                وضع الصم وضعاف السمع فائق التباين
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-5 leading-relaxed">
                شاشة كاملة بخط عملاق قابل للتكبير حتى 46 بكسل، مع وميض بصري واهتزاز متزامن وفصل ألوان المتحدثين فورياً.
              </p>
              <button
                onClick={() => setIsDeafModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-black shadow-xl shadow-red-950/60 transition-all flex items-center justify-center gap-2"
              >
                <span>تشغيل وضع القراءة المباشرة الآن</span>
              </button>
            </div>
          </div>
        ) : (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            onResetData={handleResetData}
            recordingsCount={recordings.length}
            onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveRecord(null);
          if (tab === "accessibility") {
            setIsDeafModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        recordingsCount={recordings.length}
      />

      {/* Full-Screen Deaf Accessibility Modal */}
      <DeafAccessibilityModal
        isOpen={isDeafModalOpen}
        onClose={() => setIsDeafModalOpen(false)}
        dialect={settings.dialect}
      />

      {/* GitHub Repository Publisher Modal */}
      <GitHubPublishModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  );
}
