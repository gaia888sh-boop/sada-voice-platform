import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  Bot,
  User,
  Clock,
  Copy,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";
import { TranscriptionRecord, ChatMessage } from "../types";

interface RecordingChatModalProps {
  record: TranscriptionRecord;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (seconds: number) => void;
  onUpdateChatHistory: (updatedHistory: ChatMessage[]) => void;
}

export const RecordingChatModal: React.FC<RecordingChatModalProps> = ({
  record,
  isOpen,
  onClose,
  onSeek,
  onUpdateChatHistory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(record.chatHistory || []);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested prompts
  const suggestedQueries = [
    "ما هي أبرز القرارات المتفق عليها في هذا التسجيل؟",
    "لخص لي الجزء الخاص بالواجبات والمهام القادمة.",
    "هل تم ذكر أي مواعيد أو تواريخ نهائية؟",
    "ما هي النقاط التي أبدى فيها المتحدثون تحفظاً؟",
    "استخرج أهم 3 مصطلحات تقنية وردت مع تعريفها.",
  ];

  useEffect(() => {
    if (record.chatHistory) {
      setMessages(record.chatHistory);
    }
  }, [record.chatHistory]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      createdAt: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuery("");
    setIsLoading(true);

    try {
      // Build transcript context
      const fullTranscript = record.paragraphs
        .map((p) => `[${p.timestamp}] ${p.speakerName}: ${p.text}`)
        .join("\n");

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          messages: newHistory,
          query: textToSend,
          title: record.title,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "عذراً، لم أتمكن من الحصول على إجابة في الوقت الحالي.";

      // Parse timestamp reference if exists in seconds
      let secondsRef: number | undefined;
      if (data.timestampRef) {
        const parts = data.timestampRef.split(":").map(Number);
        if (parts.length === 2) {
          secondsRef = parts[0] * 60 + parts[1];
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        text: replyText,
        timestampRef: data.timestampRef,
        secondsRef,
        createdAt: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalHistory = [...newHistory, botMsg];
      setMessages(finalHistory);
      onUpdateChatHistory(finalHistory);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        text: "تعذر الاتصال بالمساعد الذكي. يرجى التحقق من اتصالك وإعادة المحاولة.",
        createdAt: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };
      const finalHistory = [...newHistory, errorMsg];
      setMessages(finalHistory);
      onUpdateChatHistory(finalHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في مسح سجل المحادثة لهذا التسجيل؟")) {
      setMessages([]);
      onUpdateChatHistory([]);
    }
  };

  // Helper to parse and render text with clickable [MM:SS] timestamps
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d{1,2}):(\d{2})\]$/);
      if (match) {
        const secs = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        return (
          <button
            key={i}
            onClick={() => {
              onSeek(secs);
              onClose();
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-1 rounded bg-red-950/80 border border-red-500/80 text-red-300 font-mono text-[11px] hover:bg-red-900 transition-colors"
            title="انتقل إلى هذه اللحظة في التسجيل"
          >
            <Clock className="w-2.5 h-2.5 text-red-400" />
            <span>{part}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-950">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>اسأل التسجيل الصوتي</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900">
                  Gemini Copilot
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                {record.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg"
                title="مسح المحادثة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-red-500 mx-auto flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                تحدث مع محتوى هذا التسجيل
              </h4>
              <p className="text-zinc-400 text-xs mb-4 leading-relaxed max-w-xs mx-auto">
                يمكنك طرح أي سؤال حول التفريغ الصوتي، استخراج تواريخ، أو البحث عن نقطة معينة مع التوثيق بالوقت.
              </p>

              {/* Quick suggestion buttons */}
              <div className="flex flex-wrap gap-1.5 justify-center max-w-md mx-auto">
                {suggestedQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 text-zinc-300 text-[11px] transition-colors text-right flex items-center gap-1"
                  >
                    <Zap className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/50 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 relative group ${
                      isUser
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-none shadow-md shadow-red-950"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {renderMessageContent(msg.text)}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/10 text-[10px] text-zinc-400">
                      <span>{msg.createdAt}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
                          title="نسخ"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-2.5 h-2.5 text-green-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-zinc-400 text-xs">
              <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/50 text-red-400 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce delay-200" />
                </div>
                <span className="text-[11px] text-zinc-400">جارٍ قراءة التسجيل واستنباط الإجابة...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 focus-within:border-red-500 transition-colors"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="اطرح سؤالاً حول ما قيل في التسجيل..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-md shadow-red-950"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
