import React, { useState } from "react";
import {
  Settings,
  Languages,
  Mic,
  Shield,
  Ear,
  Bell,
  RotateCcw,
  Flame,
  Plus,
  X,
  Check,
  Download,
} from "lucide-react";
import { AppSettings } from "../types";

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  recordingsCount: number;
  onOpenGitHubModal?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  recordingsCount,
  onOpenGitHubModal,
}) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [savedBanner, setSavedBanner] = useState(false);

  const dialects = [
    { code: "ar-SA", name: "اللهجة السعودية والخليجية (ar-SA)" },
    { code: "ar-EG", name: "اللهجة المصرية (ar-EG)" },
    { code: "ar-AE", name: "اللهجة الإماراتية (ar-AE)" },
    { code: "ar-MA", name: "اللهجة المغربية (ar-MA)" },
    { code: "ar-DZ", name: "اللهجة الجزائرية (ar-DZ)" },
    { code: "ar-IQ", name: "اللهجة العراقية (ar-IQ)" },
    { code: "ar-JO", name: "اللهجة الشامية / الأردنية (ar-JO)" },
    { code: "ar", name: "اللغة العربية الفصحى (ar)" },
  ];

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    if (settings.alertKeywords.includes(newKeyword.trim())) {
      setNewKeyword("");
      return;
    }
    const updated = {
      ...settings,
      alertKeywords: [...settings.alertKeywords, newKeyword.trim()],
    };
    onUpdateSettings(updated);
    setNewKeyword("");
    triggerSaved();
  };

  const handleRemoveKeyword = (kw: string) => {
    const updated = {
      ...settings,
      alertKeywords: settings.alertKeywords.filter((k) => k !== kw),
    };
    onUpdateSettings(updated);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-red-500" />
            الإعدادات والتفضيلات
          </h1>
          <p className="text-[11px] text-zinc-400">تخصيص اللهجة ومحركات العزل والتنبيهات</p>
        </div>
        {savedBanner && (
          <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-950/60 px-2 py-0.5 rounded-full border border-green-800">
            <Check className="w-3 h-3" /> تم الحفظ
          </span>
        )}
      </div>

      {/* Dialect / Language Selection */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">اللهجة الافتراضية للتعرف على الصوت</h2>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3">
          يساعد ضبط اللهجة على رفع دقة التفريغ الصوتي وفهم المفردات الدارجة.
        </p>
        <select
          value={settings.dialect}
          onChange={(e) => {
            onUpdateSettings({ ...settings, dialect: e.target.value });
            triggerSaved();
          }}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
        >
          {dialects.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Audio Processing & Noise Filtering */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">معالجة الصوت المتقدمة</h2>
        </div>
        <div className="space-y-3 mt-3 text-xs">
          {/* Noise suppression toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-200 block">عزل الضوضاء الخلفية</span>
              <span className="text-[10px] text-zinc-400">تصفية صوت المكيف والمراوح والتشويش المحيط</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ ...settings, noiseSuppression: !settings.noiseSuppression });
                triggerSaved();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.noiseSuppression ? "bg-red-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.noiseSuppression ? "right-6" : "right-1"
                }`}
              />
            </button>
          </div>

          {/* Silence removal */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
            <div>
              <span className="font-bold text-zinc-200 block">إزالة فترات الصمت الطويلة</span>
              <span className="text-[10px] text-zinc-400">تسريع مراجعة التسجيل واختصار السكون</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ ...settings, silenceRemoval: !settings.silenceRemoval });
                triggerSaved();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.silenceRemoval ? "bg-red-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.silenceRemoval ? "right-6" : "right-1"
                }`}
              />
            </button>
          </div>

          {/* Auto punctuation */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
            <div>
              <span className="font-bold text-zinc-200 block">علامات الترقيم التلقائية</span>
              <span className="text-[10px] text-zinc-400">إضافة الفواصل والنقاط وعلامات الاستفهام آلياً</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ ...settings, autoPunctuation: !settings.autoPunctuation });
                triggerSaved();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.autoPunctuation ? "bg-red-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoPunctuation ? "right-6" : "right-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Keyword Alerts Manager */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">الكلمات المفتاحية المنبهة</h2>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
          إصدار تنبيه بصري أو اهتزاز فوري فور نطق أي من هذه الكلمات أثناء التسجيل المباشر.
        </p>

        {/* Add keyword input */}
        <div className="flex items-center gap-1.5 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
            placeholder="أضف كلمة جديدة واضغط إنتر..."
            className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleAddKeyword}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>

        {/* Current keywords list */}
        <div className="flex flex-wrap gap-1.5">
          {settings.alertKeywords.map((kw) => (
            <span
              key={kw}
              className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5"
            >
              <Flame className="w-3 h-3 text-red-500" />
              <span>{kw}</span>
              <button
                onClick={() => handleRemoveKeyword(kw)}
                className="text-zinc-500 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Accessibility Preferences */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <Ear className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">إمكانية الوصول (Accessibility)</h2>
        </div>
        <div className="space-y-3 mt-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-200 block">الوميض البصري عند نطق الكلمات (Visual Flash)</span>
              <span className="text-[10px] text-zinc-400">إضاءة حواف الشاشة باللون الأحمر مع كل تدفق صوتي</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ ...settings, visualAlerts: !settings.visualAlerts });
                triggerSaved();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.visualAlerts ? "bg-red-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.visualAlerts ? "right-6" : "right-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
            <div>
              <span className="font-bold text-zinc-200 block">الاهتزاز اللمسي (Haptic Feedback)</span>
              <span className="text-[10px] text-zinc-400">اهتزاز الهاتف عند التقاط كلام المتحدثين</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({ ...settings, vibrationAlerts: !settings.vibrationAlerts });
                triggerSaved();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.vibrationAlerts ? "bg-red-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.vibrationAlerts ? "right-6" : "right-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management & Storage */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">إدارة البيانات والتخزين المحلي</h2>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3">
          يوجد حالياً <span className="text-red-400 font-bold">{recordingsCount}</span> تسجيلات محفوظة في جهازك بأمان تام.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("هل تريد بالتأكيد إعادة تعيين التسجيلات واستعادة النماذج التجريبية؟")) {
                onResetData();
              }
            }}
            className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span>استعادة البيانات النموذجية الافتراضية</span>
          </button>
        </div>
      </div>

      {/* GitHub Repository Publishing */}
      {onOpenGitHubModal && (
        <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-lg bg-zinc-800 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <h2 className="text-xs font-bold text-white">نشر المشروع إلى حسابك في GitHub</h2>
          </div>
          <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
            أنشئ مستودعاً جديداً وادفع كامل الأكواد البرمجية مباشرة إلى حسابك على GitHub بنقرة زر أو عبر أوامر Terminal.
          </p>
          <button
            onClick={onOpenGitHubModal}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>نشر المشروع إلى GitHub الآن</span>
          </button>
        </div>
      )}

      {/* Export & Download Full Project ZIP */}
      <div className="mb-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-white">تصدير وتحميل المشروع كاملاً (ZIP)</h2>
        </div>
        <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
          يمكنك تحميل الكود المصدري الكامل للمشروع كملف مضغوط (.zip) جاهز للاستخراج والتشغيل على جهازك مع ملف README وجميع التبعات.
        </p>
        <a
          href="/api/download-zip"
          download="sada-voice-platform.zip"
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تحميل ملف المشروع المضغوط (ZIP)</span>
        </a>
      </div>

      {/* App Info Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-zinc-950 to-black border border-red-950 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center text-white border border-red-500/40 shadow-lg shadow-red-950">
          <Flame className="w-5 h-5 text-white animate-pulse" />
        </div>
        <h3 className="text-xs font-extrabold text-white font-['Cairo']">صدى (SADA) - النسخة الاحترافية</h3>
        <p className="text-[10px] text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
          منصة الذكاء الاصطناعي العربية المتكاملة لتسجيل وتفريغ الصوت، استخراج الأفكار، تلخيص الاجتماعات ودعم الصم وضعاف السمع.
        </p>
      </div>
    </div>
  );
};
