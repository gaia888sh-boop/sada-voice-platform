import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Check,
  Copy,
  Terminal,
  KeyRound,
  FolderGit2,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"auto" | "cli">("auto");
  const [token, setToken] = useState("");
  const [repoName, setRepoName] = useState("sada-voice-platform");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    repoUrl: string;
    repoName: string;
    owner: string;
    isPrivate: boolean;
    cloneUrl: string;
  } | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage("يرجى إدخال رمز الوصول الشخصي (Personal Access Token).");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setStatusMessage("جارِ التحقق من رمز GitHub وتجهيز المستودع...");

    try {
      const res = await fetch("/api/github/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          repoName: repoName.trim() || "sada-voice-platform",
          isPrivate,
          description:
            "Sada (صدى) - منصة النسخ الصوتي الذكي وتفريغ الاجتماعات ودعم الصم وضعاف السمع المدعومة بالذكاء الاصطناعي",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل رفع المشروع إلى GitHub.");
      }

      setResult({
        repoUrl: data.repoUrl,
        repoName: data.repoName,
        owner: data.owner,
        isPrivate: data.isPrivate,
        cloneUrl: data.cloneUrl,
      });
      setStatusMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ غير متوقع أثناء الرفع.");
    } finally {
      setIsLoading(false);
    }
  };

  const terminalCommands = [
    { label: "1. تهيئة مستودع Git محلياً", cmd: "git init" },
    { label: "2. إضافة جميع ملفات المشروع", cmd: "git add ." },
    { label: "3. عمل حفظ أولي (Commit)", cmd: 'git commit -m "Initial commit: Sada Voice Platform"' },
    { label: "4. ضبط الفرع الرئيسي إلى main", cmd: "git branch -M main" },
    {
      label: "5. ربط المستودع بحسابك على GitHub",
      cmd: `git remote add origin https://github.com/<YOUR_USERNAME>/${repoName || "sada-voice-platform"}.git`,
    },
    { label: "6. رفع الكود (Push)", cmd: "git push -u origin main" },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleCopyAll = () => {
    const all = terminalCommands.map((c) => c.cmd).join("\n");
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-white shadow-inner">
              {/* GitHub Octocat SVG */}
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                نشر المشروع إلى GitHub
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  مباشر
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                ارفع الكود كاملاً إلى حسابك على GitHub بنقرة زر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/80 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "auto"
                ? "border-red-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>النشر المباشر السريع (مُوصى به)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cli")}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "cli"
                ? "border-red-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>أوامر الطرفية (Manual CLI)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === "auto" ? (
            <div>
              {/* Success Result Card */}
              {result ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-950/40 via-zinc-900 to-black border border-green-800/60 text-right animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-bold mb-2">
                    <Check className="w-5 h-5 text-green-400 bg-green-950 rounded-full p-0.5 border border-green-700" />
                    <span>تم إنشاء ونشر المستودع بنجاح على حسابك! 🚀</span>
                  </div>

                  <p className="text-xs text-zinc-300 mb-3">
                    أصبح مشروع <strong className="text-white">صدى (SADA)</strong> متاحاً بالكامل على GitHub مع جميع ملفات الإعداد والمصدر.
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 mb-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300 dir-ltr truncate max-w-[280px]">
                      {result.repoUrl}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {result.isPrivate ? "خاص (Private)" : "عام (Public)"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <a
                      href={result.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-green-950 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح المستودع على GitHub</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`git clone ${result.cloneUrl}`);
                        setCopiedIndex(999);
                        setTimeout(() => setCopiedIndex(null), 1800);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {copiedIndex === 999 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span>تم نسخ رابط الاستنساخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ Git Clone</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePublish} className="space-y-4">
                  {/* GitHub Token Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-red-500" />
                        <span>رمز الوصول الشخصي (GitHub Personal Access Token)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Sada-App-Publisher"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                      >
                        <span>توليد رمز جديد بنقرة واحدة</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (أو github_pat_...)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono dir-ltr text-right"
                      required
                      autoComplete="off"
                    />

                    <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>
                        يحتاج الرمز فقط إلى صلاحية <code className="text-red-400 font-mono">repo</code> لإنشاء المستودع ورفع الأكواد بأمان. لا يتم حفظ الرمز على الخادم، ويتم حذفه فور اكتمال الرفع.
                      </span>
                    </div>
                  </div>

                  {/* Repository Name Field */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-1.5 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-red-500" />
                      <span>اسم المستودع (Repository Name)</span>
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="sada-voice-platform"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono dir-ltr text-right"
                      required
                    />
                  </div>

                  {/* Visibility: Public / Private */}
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPrivate ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-400" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">
                          {isPrivate ? "مستودع خاص (Private)" : "مستودع عام (Public)"}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {isPrivate
                            ? "مرئي لك فقط ولمن تمنحه صلاحية الوصول"
                            : "متاح للجميع للاطلاع عليه والمساهمة فيه"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isPrivate ? "bg-amber-600" : "bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          isPrivate ? "right-6" : "right-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{errorMessage}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{statusMessage || "جارِ النشر إلى GitHub..."}</span>
                      </>
                    ) : (
                      <>
                        {/* GitHub Octocat small SVG */}
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>نشر المشروع الآن إلى حسابي في GitHub</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Terminal Commands Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  إذا كنت تفضّل رفع الكود من جهازك باستخدام موجه الأوامر (Terminal):
                </p>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span>تم نسخ جميع الأوامر</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ الكل</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2.5">
                {terminalCommands.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5"
                  >
                    <div className="text-[11px] font-bold text-zinc-300">{item.label}</div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black font-mono text-[11px] text-zinc-200 dir-ltr">
                      <span className="truncate">{item.cmd}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.cmd, idx)}
                        className="text-zinc-500 hover:text-white p-1 transition-colors shrink-0"
                        title="نسخ"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                💡 <strong className="text-white">ملاحظة:</strong> تأكد أولاً من تحميل الملف المضغوط وفك ضغطه على حاسوبك، أو استبدال <code className="text-red-400">&lt;YOUR_USERNAME&gt;</code> باسم حسابك في GitHub.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/40 text-center">
          <p className="text-[10px] text-zinc-500">
            منصة صدى (Sada) للنسخ الصوتي والذكاء الاصطناعي العربي • مرخصة ومعدة للنشر الفوري
          </p>
        </div>
      </div>
    </div>
  );
};
