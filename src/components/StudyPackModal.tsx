import React, { useState } from "react";
import {
  GraduationCap,
  Sparkles,
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Award,
  Layers,
} from "lucide-react";
import { TranscriptionRecord, Flashcard, QuizQuestion } from "../types";

interface StudyPackModalProps {
  record: TranscriptionRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudyPack: (flashcards: Flashcard[], quiz: QuizQuestion[]) => void;
}

export const StudyPackModal: React.FC<StudyPackModalProps> = ({
  record,
  isOpen,
  onClose,
  onUpdateStudyPack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"flashcards" | "quiz">("flashcards");
  const [flashcards, setFlashcards] = useState<Flashcard[]>(record.flashcards || []);
  const [quiz, setQuiz] = useState<QuizQuestion[]>(record.quiz || []);
  const [isLoading, setIsLoading] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleGenerateStudyPack = async () => {
    setIsLoading(true);
    try {
      const fullTranscript = record.paragraphs
        .map((p) => `${p.speakerName}: ${p.text}`)
        .join("\n");
      const res = await fetch("/api/gemini/study-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          title: record.title,
        }),
      });
      const data = await res.json();
      if (data.flashcards || data.quiz) {
        setFlashcards(data.flashcards || []);
        setQuiz(data.quiz || []);
        setCurrentCardIndex(0);
        setIsCardFlipped(false);
        setSelectedAnswers({});
        setQuizSubmitted(false);
        onUpdateStudyPack(data.flashcards || [], data.quiz || []);
      }
    } catch (err) {
      console.error("Study pack error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setIsCardFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setIsCardFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>حزمة الاستذكار الأكاديمية</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900">
                  Study Pack
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">{record.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGenerateStudyPack}
              disabled={isLoading}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-red-950 transition-colors"
            >
              <RotateCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>{flashcards.length ? "إعادة التوليد" : "توليد الحزمة"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-zinc-900 bg-zinc-950">
          <button
            onClick={() => setActiveSubTab("flashcards")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "flashcards"
                ? "bg-red-600 text-white shadow-md shadow-red-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>بطاقات استذكار ({flashcards.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("quiz")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "quiz"
                ? "bg-red-600 text-white shadow-md shadow-red-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>اختبار تفاعلي ({quiz.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center">
          {flashcards.length === 0 && quiz.length === 0 && !isLoading ? (
            <div className="text-center max-w-sm mx-auto my-auto">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-red-500 mx-auto flex items-center justify-center mb-3 shadow-xl">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                توليد بطاقات واختبار ذكي
              </h4>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                تحويل تفريغ المحاضرة أو الاجتماع إلى بطاقات مراجعة سريعة مع أسئلة اختيار من متعدد لاختبار الاستيعاب.
              </p>
              <button
                onClick={handleGenerateStudyPack}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>إنشاء حزمة الاستذكار الآن</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center my-auto">
              <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-zinc-300 font-semibold">
                جارٍ تحليل المحتوى وتأليف البطاقات والأسئلة...
              </p>
              <span className="text-[10px] text-zinc-500">Gemini AI Educational Engine</span>
            </div>
          ) : activeSubTab === "flashcards" ? (
            /* Flashcards Tab */
            <div className="max-w-md w-full mx-auto flex flex-col items-center justify-center my-auto">
              {/* Progress */}
              <div className="flex items-center justify-between w-full mb-3 text-xs text-zinc-400">
                <span>
                  البطاقة {currentCardIndex + 1} من {flashcards.length}
                </span>
                <span className="text-[11px] text-red-400 font-semibold">اضغط على البطاقة لقلبها</span>
              </div>

              {/* Card */}
              {flashcards[currentCardIndex] && (
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className={`w-full min-h-[220px] p-6 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col justify-between select-none shadow-xl ${
                    isCardFlipped
                      ? "bg-gradient-to-br from-zinc-900 to-red-950/40 border-red-500/80 shadow-red-950/30"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {isCardFlipped ? "الإجابة" : "السؤال / المفهوم"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      #{currentCardIndex + 1}
                    </span>
                  </div>

                  <div className="text-center py-4">
                    <p className={`text-sm sm:text-base font-bold leading-relaxed ${isCardFlipped ? "text-red-200" : "text-white"}`}>
                      {isCardFlipped
                        ? flashcards[currentCardIndex].answer
                        : flashcards[currentCardIndex].question}
                    </p>
                  </div>

                  <div className="text-center text-[11px] text-zinc-500">
                    {isCardFlipped ? "انقر للعودة للسؤال" : "انقر لعرض الإجابة"}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full mt-5">
                <button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-200 text-xs font-bold flex items-center gap-1 border border-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="px-4 py-2 rounded-xl bg-red-950 border border-red-500/50 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
                >
                  {isCardFlipped ? "عرض السؤال" : "إظهار الإجابة"}
                </button>

                <button
                  onClick={handleNextCard}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-200 text-xs font-bold flex items-center gap-1 border border-zinc-800 transition-colors"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Tab */
            <div className="space-y-4 max-w-lg mx-auto w-full">
              {quiz.map((q, qIndex) => {
                const selectedOpt = selectedAnswers[q.id];
                return (
                  <div
                    key={q.id || qIndex}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        {q.question}
                      </h4>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                      {q.options.map((option, optIndex) => {
                        const isSelected = selectedOpt === optIndex;
                        const isCorrect = q.correctIndex === optIndex;
                        let style = "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700";

                        if (quizSubmitted) {
                          if (isCorrect) {
                            style = "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold";
                          } else if (isSelected && !isCorrect) {
                            style = "bg-red-950/80 border-red-500 text-red-200";
                          }
                        } else if (isSelected) {
                          style = "bg-red-950/60 border-red-500 text-white font-semibold";
                        }

                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleSelectQuizOption(q.id, optIndex)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${style}`}
                          >
                            <span>{option}</span>
                            {quizSubmitted && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {quizSubmitted && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {quizSubmitted && (
                      <div className="mt-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                        <span className="text-red-400 font-bold ml-1">توضيح:</span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit / Score Banner */}
              <div className="pt-2">
                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(selectedAnswers).length < quiz.length}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-red-950"
                  >
                    تسليم الإجابات وعرض النتيجة
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950 to-zinc-900 border border-red-500/60 text-center">
                    <Award className="w-7 h-7 text-amber-400 mx-auto mb-1 animate-bounce" />
                    <h4 className="text-sm font-black text-white">
                      النتيجة: {calculateScore()} من {quiz.length}
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {calculateScore() === quiz.length
                        ? "أداء متميز واستيعاب كامل لمحتوى التسجيل!"
                        : "مراجعة رائعة، يمكنك إعادة المحاولة لترسيخ المعلومات."}
                    </p>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setSelectedAnswers({});
                      }}
                      className="mt-3 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg"
                    >
                      إعادة الاختبار
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
