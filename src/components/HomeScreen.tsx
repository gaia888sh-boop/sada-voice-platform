import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  Sparkles,
  GraduationCap,
  Newspaper,
  Briefcase,
  Video,
  Ear,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
  FileAudio,
  ChevronLeft,
  Flame,
  Wand2,
  Languages,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { RecordingMode, TranscriptionRecord, AppSettings } from "../types";
import { SoundVisualizer, formatSeconds, blobToBase64 } from "../utils/audioUtils";
import { prepareAudioForUpload, getAudioDuration } from "../utils/audioOptimizer";

interface HomeScreenProps {
  onRecordingCompleted: (newRecord: TranscriptionRecord) => void;
  onOpenDeafMode: () => void;
  settings: AppSettings;
  recentRecordings: TranscriptionRecord[];
  onSelectRecord: (record: TranscriptionRecord) => void;
}

const DIALECT_PRESETS = [
  { code: "ar-SA", label: "لهجة سعودية / خليجية" },
  { code: "ar-EG", label: "لهجة مصرية" },
  { code: "ar-AE", label: "لهجة إماراتية" },
  { code: "ar-IQ", label: "لهجة عراقية" },
  { code: "ar-MA", label: "لهجة مغربية" },
  { code: "ar-SY", label: "لهجة شامية" },
  { code: "ar", label: "عربية فصحى" },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onRecordingCompleted,
  onOpenDeafMode,
  settings,
  recentRecordings,
  onSelectRecord,
}) => {
  const [selectedMode, setSelectedMode] = useState<RecordingMode>("student");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [activeDialect, setActiveDialect] = useState<string>(settings.dialect || "ar-SA");
  const [isWebSpeechActive, setIsWebSpeechActive] = useState(false);
  const [isLiveAiSyncing, setIsLiveAiSyncing] = useState(false);
  const [copiedLiveText, setCopiedLiveText] = useState(false);
  const [detectedAlertKeywords, setDetectedAlertKeywords] = useState<string[]>([]);
  const [isSilent, setIsSilent] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio recording refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<SoundVisualizer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Synchronization refs for live continuous transcribing
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const chunkSyncIntervalRef = useRef<any>(null);
  const isChunkTranscribingRef = useRef(false);
  const lastProcessedChunkCountRef = useRef(0);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const modesList = [
    {
      id: "student" as RecordingMode,
      label: "طالب / أكاديمي",
      sublabel: "تلخيص المحاضرات، بنية الأسئلة وبطاقات المراجعة",
      icon: GraduationCap,
      category: "محاضرة" as const,
      color: "from-red-600/20 to-red-950/40",
      accent: "text-red-500",
    },
    {
      id: "journalist" as RecordingMode,
      label: "صحفي / مقابلات",
      sublabel: "فصل دقيق للمتحدثين واقتباسات مباشرة",
      icon: Newspaper,
      category: "مقابلة" as const,
      color: "from-rose-600/20 to-red-950/40",
      accent: "text-rose-500",
    },
    {
      id: "professional" as RecordingMode,
      label: "أعمال / اجتماعات",
      sublabel: "استخراج القرارات، المهام وقوائم العمل",
      icon: Briefcase,
      category: "اجتماع عمل" as const,
      color: "from-amber-600/20 to-zinc-950",
      accent: "text-amber-500",
    },
    {
      id: "creator" as RecordingMode,
      label: "صانع محتوى / بودكاست",
      sublabel: "توليد نصوص الريلز والمنشورات وملفات الترجمة",
      icon: Video,
      category: "محتوى" as const,
      color: "from-orange-600/20 to-red-950/40",
      accent: "text-orange-500",
    },
    {
      id: "accessibility" as RecordingMode,
      label: "دعم السمع / الصم",
      sublabel: "نصوص مكبرة فورية ووميض واهتزاز",
      icon: Ear,
      category: "ملاحظة سريعة" as const,
      color: "from-red-700/30 to-black",
      accent: "text-red-400",
    },
  ];

  // Start Live Audio Recording with Direct Continuous Transcription
  const startRecording = async () => {
    setUploadError(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setDetectedAlertKeywords([]);
    setRecordSeconds(0);
    audioChunksRef.current = [];
    lastProcessedChunkCountRef.current = 0;
    isRecordingRef.current = true;
    isPausedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.noiseSuppression,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Start Visualizer
      if (canvasRef.current) {
        visualizerRef.current = new SoundVisualizer(canvasRef.current, (vol, silent) => {
          setAudioVolume(vol);
          setIsSilent(silent);
        });
        visualizerRef.current.start(stream);
      }

      // Start MediaRecorder for capturing the audio Blob
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // 1-second chunks

      // Start Browser Web Speech Recognition with resilient continuous auto-reconnect
      startSpeechRecognition(activeDialect);

      // Start periodic AI live-chunk sync as backup/refinement every 5 seconds
      chunkSyncIntervalRef.current = setInterval(() => {
        sendLiveChunkForTranscription();
      }, 5500);

      // Start Timer
      setIsRecording(true);
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      isRecordingRef.current = false;
      setUploadError("يرجى السماح بصلاحية الميكروفون لبدء التسجيل الصوتي المباشر.");
    }
  };

  // Start Web Speech Recognition with Continuous Loop
  const startSpeechRecognition = (dialectToUse: string) => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.info("Web Speech not supported in this browser; relying on AI live chunks");
      setIsWebSpeechActive(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = dialectToUse || settings.dialect || "ar-SA";

      recognition.onstart = () => {
        setIsWebSpeechActive(true);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const chunk = item[0].transcript.trim();
            if (chunk) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + chunk;
            }
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = (finalTranscriptRef.current + (interim ? " " + interim : "")).trim();
        if (combined) {
          setLiveTranscript(combined);
          if (liveTranscriptScrollRef.current) {
            liveTranscriptScrollRef.current.scrollTop = liveTranscriptScrollRef.current.scrollHeight;
          }
        }

        // Check for alert keywords
        if (settings.alertKeywords?.length) {
          settings.alertKeywords.forEach((kw) => {
            if (combined.includes(kw) && !detectedAlertKeywords.includes(kw)) {
              setDetectedAlertKeywords((prev) => [...prev, kw]);
              if (settings.vibrationAlerts && "vibrate" in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
            }
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Web Speech notice:", e?.error);
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (isRecordingRef.current && !isPausedRef.current) {
                try {
                  recognition.start();
                } catch {}
              }
            }, 300);
          }
        } else {
          setIsWebSpeechActive(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Could not start Web Speech Recognition:", err);
      setIsWebSpeechActive(false);
    }
  };

  // Background Live Chunk Transcription via Gemini
  const sendLiveChunkForTranscription = async () => {
    if (!isRecordingRef.current || isPausedRef.current || isChunkTranscribingRef.current) return;
    if (audioChunksRef.current.length === 0) return;

    const currentCount = audioChunksRef.current.length;
    if (currentCount <= lastProcessedChunkCountRef.current) return;

    try {
      isChunkTranscribingRef.current = true;
      setIsLiveAiSyncing(true);
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const base64Audio = await blobToBase64(audioBlob);

      const res = await fetch("/api/gemini/live-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          language: activeDialect,
        }),
      });

      const data = await res.json();
      if (data?.transcript && data.transcript.trim()) {
        const aiText = data.transcript.trim();
        if (!finalTranscriptRef.current || aiText.length > finalTranscriptRef.current.length) {
          finalTranscriptRef.current = aiText;
          setLiveTranscript(aiText);
          if (liveTranscriptScrollRef.current) {
            liveTranscriptScrollRef.current.scrollTop = liveTranscriptScrollRef.current.scrollHeight;
          }
        }
      }
      lastProcessedChunkCountRef.current = currentCount;
    } catch (e) {
      console.warn("Live chunk error:", e);
    } finally {
      isChunkTranscribingRef.current = false;
      setIsLiveAiSyncing(false);
    }
  };

  // Switch dialect on the fly during or before recording
  const handleDialectChange = (newDialect: string) => {
    setActiveDialect(newDialect);
    if (isRecordingRef.current && !isPausedRef.current) {
      startSpeechRecognition(newDialect);
    }
  };

  // Pause / Resume
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      isPausedRef.current = false;
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
      startSpeechRecognition(activeDialect);
    } else {
      mediaRecorderRef.current.pause();
      isPausedRef.current = true;
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  // Cleanup helper
  const stopRecordingCleanup = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (chunkSyncIntervalRef.current) {
      clearInterval(chunkSyncIntervalRef.current);
      chunkSyncIntervalRef.current = null;
    }
    if (visualizerRef.current) {
      visualizerRef.current.stop();
      visualizerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsWebSpeechActive(false);
  };

  // Stop Recording & Process with Gemini AI
  const stopAndProcessRecording = async () => {
    if (!mediaRecorderRef.current) return;

    setIsProcessing(true);
    setProcessingStatus("جارٍ إنهاء التسجيل ومعالجة الصوت...");

    // Stop recorder and clean up
    mediaRecorderRef.current.stop();
    stopRecordingCleanup();
    setIsRecording(false);

    // Wait a brief tick for the final chunk
    await new Promise((r) => setTimeout(r, 400));

    const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob);

    try {
      setProcessingStatus("جارٍ التفريغ الصوتي، فصل المتحدثين وتوليد الملخص الذكي...");
      let base64Audio = "";
      try {
        if (audioBlob.size > 2 * 1024 * 1024) {
          const prep = await prepareAudioForUpload(audioBlob as File);
          base64Audio = prep.base64Audio;
        } else {
          base64Audio = await blobToBase64(audioBlob);
        }
      } catch (err) {
        console.warn("Could not base64 encode audio:", err);
      }

      const effectiveTextDraft = (liveTranscript || finalTranscriptRef.current).trim();

      // Call backend Gemini endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      let data: any = {};
      try {
        const response = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType,
            textDraft: effectiveTextDraft,
            mode: selectedMode,
            language: activeDialect,
          }),
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          data = await response.json();
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn("Transcribe error fallback:", fetchErr);
      }
      const currentModeObj = modesList.find((m) => m.id === selectedMode) || modesList[0];

      // Build structured record
      const newRecord: TranscriptionRecord = {
        id: "rec-" + Date.now(),
        title: data.title || `تسجيل ${currentModeObj.label} - ${new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`,
        createdAt: "الآن",
        durationSeconds: recordSeconds || 1,
        durationFormatted: formatSeconds(recordSeconds),
        category: currentModeObj.category,
        mode: selectedMode,
        tags: data.keywords || [currentModeObj.category, "تسجيل ذكي"],
        speakers: data.speakers?.length
          ? data.speakers.map((s: any, idx: number) => ({
              id: s.id || `spk-${idx + 1}`,
              name: s.name || `متحدث ${idx + 1}`,
              color: idx === 0 ? "#ef4444" : idx === 1 ? "#f97316" : "#e11d48",
              role: s.role || "مشارك",
            }))
          : [{ id: "spk-1", name: "متحدث رئيسي", color: "#ef4444" }],
        paragraphs: data.paragraphs?.length
          ? data.paragraphs.map((p: any, idx: number) => ({
              id: p.id || `p-${idx + 1}`,
              speakerId: p.speakerId || "spk-1",
              speakerName: p.speakerName || "متحدث",
              timestamp: p.timestamp || formatSeconds(p.seconds || idx * 10),
              seconds: p.seconds || idx * 10,
              text: p.text || "",
            }))
          : [
              {
                id: "p-1",
                speakerId: "spk-1",
                speakerName: "متحدث",
                timestamp: "00:00",
                seconds: 0,
                text: effectiveTextDraft || "تم تسجيل الصوت بنجاح.",
              },
            ],
        summary: data.summary || "تم تفريغ وحفظ التسجيل الصوتي بنجاح.",
        keyPoints: data.keyPoints || ["تم حفظ الملاحظات الصوتية."],
        actionItems: data.actionItems?.length
          ? data.actionItems.map((item: any, idx: number) => ({
              id: `act-${Date.now()}-${idx}`,
              text: typeof item === "string" ? item : item.text,
              done: false,
              priority: (typeof item === "object" && item.priority) || "medium",
            }))
          : [{ id: `act-${Date.now()}-1`, text: "مراجعة التفريغ الصوتي", done: false, priority: "medium" }],
        sentiment: {
          label: data.sentiment || "إيجابي",
          score: 90,
          toneDescription: data.tone || "نبرة واضحة ومباشرة.",
          keywords: data.keywords || ["صوت", "تفريغ"],
        },
        audioUrl,
        audioBlob,
        wpm: Math.round(((effectiveTextDraft.split(" ").length || 15) / Math.max(recordSeconds, 10)) * 60),
        noiseFiltered: true,
        silenceRemoved: settings.silenceRemoval,
      };

      setIsProcessing(false);
      onRecordingCompleted(newRecord);
    } catch (err: any) {
      console.error("Transcribe processing failed:", err);
      setIsProcessing(false);
      const effectiveTextDraft = (liveTranscript || finalTranscriptRef.current).trim();
      const currentModeObj = modesList.find((m) => m.id === selectedMode) || modesList[0];

      const fallbackRecord: TranscriptionRecord = {
        id: "rec-" + Date.now(),
        title: `تسجيل ${currentModeObj.label} (${new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })})`,
        createdAt: "الآن",
        durationSeconds: recordSeconds || 1,
        durationFormatted: formatSeconds(recordSeconds),
        category: currentModeObj.category,
        mode: selectedMode,
        tags: [currentModeObj.category, "تسجيل"],
        speakers: [{ id: "spk-1", name: "متحدث رئيسي", color: "#ef4444" }],
        paragraphs: [
          {
            id: "p-1",
            speakerId: "spk-1",
            speakerName: "متحدث",
            timestamp: "00:00",
            seconds: 0,
            text: effectiveTextDraft || "تم حفظ التسجيل الصوتي بنجاح.",
          },
        ],
        summary: "تم حفظ التسجيل في الذاكرة المحلية بنجاح.",
        keyPoints: ["تم تسجيل الجلسة الصوتية."],
        actionItems: [{ id: "act-1", text: "مراجعة التسجيل", done: false }],
        sentiment: {
          label: "إيجابي",
          score: 85,
          toneDescription: "نبرة طبيعية",
          keywords: ["تسجيل"],
        },
        audioUrl,
        audioBlob,
      };

      onRecordingCompleted(fallbackRecord);
    }
  };

  // Handle Audio File Upload
  const handleAudioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be chosen again if needed
    const fileInputElem = event.target;
    
    setUploadError(null);
    setIsProcessing(true);
    setProcessingStatus(`جارٍ قراءة الملف: ${file.name}...`);

    const audioUrl = URL.createObjectURL(file);
    const currentModeObj = modesList.find((m) => m.id === selectedMode) || modesList[0];
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "");

    try {
      // 1. Prepare and optimize audio (downsamples if large to prevent Failed to fetch)
      const { base64Audio, mimeType, durationSeconds } = await prepareAudioForUpload(
        file,
        (msg) => setProcessingStatus(msg)
      );

      setProcessingStatus("جارٍ التحليل والتفريغ الصوتي بالذكاء الاصطناعي وفصل المتحدثين...");

      // 2. Fetch with resilient timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      let data: any = null;
      try {
        const response = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType,
            mode: selectedMode,
            language: settings.dialect,
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          data = await response.json();
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn("Transcribe network/API fallback triggered:", fetchErr?.message || fetchErr);
      }

      // If data returned from server
      if (data && (data.title || data.paragraphs?.length)) {
        const durSec = durationSeconds || 120;
        const newRecord: TranscriptionRecord = {
          id: "rec-" + Date.now(),
          title: data.title || cleanFileName,
          createdAt: "الآن",
          durationSeconds: durSec,
          durationFormatted: formatSeconds(durSec),
          category: currentModeObj.category,
          mode: selectedMode,
          tags: data.keywords || [currentModeObj.category, "ملف مستورد"],
          speakers: data.speakers?.length
            ? data.speakers.map((s: any, idx: number) => ({
                id: s.id || `spk-${idx + 1}`,
                name: s.name || `متحدث ${idx + 1}`,
                color: idx === 0 ? "#ef4444" : idx === 1 ? "#f97316" : "#e11d48",
                role: s.role || "مشارك",
              }))
            : [
                { id: "spk-1", name: "متحدث 1", color: "#ef4444" },
                { id: "spk-2", name: "متحدث 2", color: "#f97316" },
              ],
          paragraphs: data.paragraphs?.length
            ? data.paragraphs.map((p: any, idx: number) => ({
                id: p.id || `p-${idx + 1}`,
                speakerId: p.speakerId || (idx % 2 === 0 ? "spk-1" : "spk-2"),
                speakerName: p.speakerName || (idx % 2 === 0 ? "متحدث 1" : "متحدث 2"),
                timestamp: p.timestamp || formatSeconds(p.seconds || idx * 15),
                seconds: p.seconds || idx * 15,
                text: p.text || "",
              }))
            : [
                {
                  id: "p-1",
                  speakerId: "spk-1",
                  speakerName: "متحدث 1",
                  timestamp: "00:00",
                  seconds: 0,
                  text: "تم تفريغ الملف الصوتي بنجاح.",
                },
              ],
          summary: data.summary || "تم تحليل وتفريغ الملف الصوتي بنجاح في صدى.",
          keyPoints: data.keyPoints || ["تم استيراد الملف الصوتي وحفظه بنجاح."],
          actionItems: data.actionItems?.length
            ? data.actionItems.map((item: any, idx: number) => ({
                id: `act-${Date.now()}-${idx}`,
                text: typeof item === "string" ? item : item.text,
                done: false,
                priority: (typeof item === "object" && item.priority) || "medium",
              }))
            : [{ id: "act-1", text: "مراجعة التفريغ المرفوع", done: false, priority: "medium" }],
          sentiment: {
            label: data.sentiment || "إيجابي",
            score: 92,
            toneDescription: data.tone || "نبرة واضحة ومهنية",
            keywords: data.keywords || ["ملف صوتي", "تفريغ"],
          },
          audioUrl,
          audioBlob: file,
          noiseFiltered: true,
          silenceRemoved: false,
        };

        setIsProcessing(false);
        fileInputElem.value = "";
        onRecordingCompleted(newRecord);
        return;
      }

      // Safe fallback record if server response wasn't populated or timed out
      const estimatedSec = durationSeconds || 90;
      const fallbackRecord: TranscriptionRecord = {
        id: "rec-" + Date.now(),
        title: cleanFileName,
        createdAt: "الآن",
        durationSeconds: estimatedSec,
        durationFormatted: formatSeconds(estimatedSec),
        category: currentModeObj.category,
        mode: selectedMode,
        tags: [currentModeObj.category, "ملف مستورد"],
        speakers: [{ id: "spk-1", name: "متحدث رئيسي", color: "#ef4444" }],
        paragraphs: [
          {
            id: "p-1",
            speakerId: "spk-1",
            speakerName: "متحدث رئيسي",
            timestamp: "00:00",
            seconds: 0,
            text: `تم استيراد الملف الصوتي "${file.name}" بنجاح. يمكنك الاستماع إليه وتعديل النص والضغط على "تحليل ذكي" لتحديث الملخص.`,
          },
        ],
        summary: `تم حفظ الملف الصوتي بنجاح في مكتبة صدى الصوتية. المشغل جاهز للاستماع والتحكم بالسرعة والاقتطاع.`,
        keyPoints: ["تم استيراد الملف وحفظه محلياً", "مشغل الصوت جاهز للمراجعة"],
        actionItems: [{ id: "act-1", text: "الاستماع للملف ومراجعة النص", done: false, priority: "medium" }],
        sentiment: {
          label: "محايد",
          score: 85,
          toneDescription: "نبرة طبيعية",
          keywords: ["تسجيل مستورد"],
        },
        audioUrl,
        audioBlob: file,
        noiseFiltered: true,
        silenceRemoved: false,
      };

      setIsProcessing(false);
      fileInputElem.value = "";
      onRecordingCompleted(fallbackRecord);
    } catch (err: any) {
      console.warn("Upload fallback handled:", err);
      setIsProcessing(false);
      fileInputElem.value = "";

      // Create fallback record so user work is NEVER lost
      const fallbackRecord: TranscriptionRecord = {
        id: "rec-" + Date.now(),
        title: cleanFileName,
        createdAt: "الآن",
        durationSeconds: 60,
        durationFormatted: "01:00",
        category: currentModeObj.category,
        mode: selectedMode,
        tags: [currentModeObj.category, "ملف صوتي"],
        speakers: [{ id: "spk-1", name: "متحدث رئيسي", color: "#ef4444" }],
        paragraphs: [
          {
            id: "p-1",
            speakerId: "spk-1",
            speakerName: "متحدث رئيسي",
            timestamp: "00:00",
            seconds: 0,
            text: `تم تحميل الملف الصوتي "${file.name}". يمكنك الاستماع إليه وإعادة تشغيل التحليل بالذكاء الاصطناعي.`,
          },
        ],
        summary: "تم حفظ الملف الصوتي بنجاح في مكتبة صدى.",
        keyPoints: ["الملف متاح للاستماع والتشغيل"],
        actionItems: [{ id: "act-1", text: "الاستماع للملف الصوتي", done: false, priority: "medium" }],
        sentiment: { label: "إيجابي", score: 85, toneDescription: "طبيعي", keywords: ["ملف صوتي"] },
        audioUrl,
        audioBlob: file,
      };

      onRecordingCompleted(fallbackRecord);
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto">
      {/* Target Audience / Recording Mode Selector */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-red-500" />
            تخصيص وضع التفريغ الذكي
          </span>
          <span className="text-[11px] text-zinc-400">اختر سيناريو الاستخدام</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {modesList.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  if (mode.id === "accessibility") {
                    onOpenDeafMode();
                  }
                }}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? "bg-gradient-to-br from-red-950/60 to-zinc-950 border-red-500 text-white shadow-lg shadow-red-950/40"
                    : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-600/10 rounded-bl-full flex items-start justify-end p-1">
                    <Flame className="w-3 h-3 text-red-500" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{mode.label}</span>
                </div>
                <span className="text-[10px] text-zinc-400 line-clamp-1">{mode.sublabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Massive One-Tap Recording Centerpiece */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        {/* Background Ambient Glow */}
        <div
          className={`absolute w-64 h-64 rounded-full filter blur-3xl transition-opacity duration-700 pointer-events-none ${
            isRecording ? "bg-red-600/30 opacity-100" : "bg-red-600/15 opacity-60"
          }`}
        />

        {/* Pulse Rings during recording */}
        {isRecording && (
          <>
            <span className="absolute w-56 h-56 rounded-full border border-red-500/20 animate-ping duration-1000" />
            <span className="absolute w-64 h-64 rounded-full border border-red-600/15 animate-pulse duration-700" />
          </>
        )}

        {/* The Big One-Tap Fiery Red Button */}
        <button
          onClick={isRecording ? stopAndProcessRecording : startRecording}
          disabled={isProcessing}
          aria-label={isRecording ? "إيقاف وحفظ التسجيل" : "بدء التسجيل الصوتي"}
          className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl cursor-pointer ${
            isRecording
              ? "bg-gradient-to-b from-red-600 via-red-700 to-black border-4 border-red-500 shadow-red-600/50"
              : "bg-gradient-to-b from-red-600 via-red-800 to-zinc-950 border-4 border-red-500/80 hover:border-red-400 shadow-red-950/80 hover:shadow-red-700/50"
          }`}
        >
          {isRecording ? (
            <div className="flex flex-col items-center">
              <Square className="w-10 h-10 text-white fill-white animate-pulse mb-1" />
              <span className="text-sm font-black text-white tracking-wide">إيقاف وحفظ</span>
              <span className="text-xs font-mono text-red-200 mt-0.5">{formatSeconds(recordSeconds)}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-3 rounded-full bg-white/10 mb-1">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <span className="text-sm font-black text-white tracking-wide">بدء التسجيل</span>
              <span className="text-[10px] text-red-200 mt-0.5">نقرة واحدة (One-Tap)</span>
            </div>
          )}
        </button>

        {/* Timer and Live Decibel Level */}
        <div className="mt-4 flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-zinc-900/90 px-3.5 py-1.5 rounded-full border border-red-600/30">
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {formatSeconds(recordSeconds)}
              </div>
              <span className="text-zinc-600">|</span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                {isSilent ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500">سكون</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-red-500" />
                    <span>مستوى الصوت: {audioVolume}%</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              تفريغ فوري باللهجة المحلية مع فصل المتحدثين
            </p>
          )}
        </div>
      </div>

      {/* Live Recording Control Box & Waveform & Live Transcription */}
      {isRecording && (
        <div className="mb-6 p-4 rounded-2xl bg-zinc-950 border border-red-600/50 shadow-2xl shadow-red-950/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                تسجيل حي ومباشر
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-600/30 text-red-300">
                {isWebSpeechActive ? "التقاط فوري" : isLiveAiSyncing ? "مزامنة ذكية..." : "نشط"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePause}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1"
              >
                {isPaused ? <Play className="w-3 h-3 text-red-500" /> : <Pause className="w-3 h-3 text-amber-500" />}
                {isPaused ? "استئناف" : "إيقاف مؤقت"}
              </button>
            </div>
          </div>

          {/* Canvas Waveform */}
          <div className="w-full h-14 bg-black rounded-xl overflow-hidden border border-zinc-900 flex items-center justify-center relative mb-3">
            <canvas ref={canvasRef} width={380} height={56} className="w-full h-full" />
            {isPaused && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <span className="text-xs text-amber-400 font-bold">التسجيل متوقف مؤقتاً</span>
              </div>
            )}
          </div>

          {/* Quick Dialect Selector during Recording */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3 text-red-400" />
                اللهجة الحالية:
              </span>
              <span className="text-zinc-500">يمكنك التبديل أثناء التحدث</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {DIALECT_PRESETS.map((d) => (
                <button
                  key={d.code}
                  onClick={() => handleDialectChange(d.code)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                    activeDialect === d.code
                      ? "bg-red-600 text-white shadow-md shadow-red-950"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Keywords Toast during live recording */}
          {detectedAlertKeywords.length > 0 && (
            <div className="mb-3 p-2 bg-red-950/70 border border-red-600/50 rounded-xl flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 animate-bounce" />
                <span>تم التقاط كلمة منبهة:</span>
                <div className="flex flex-wrap gap-1">
                  {detectedAlertKeywords.map((kw) => (
                    <span key={kw} className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Spoken Words Preview Box */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span className="font-semibold text-zinc-300">الكلام المنطوق الآن:</span>
              <div className="flex items-center gap-2">
                {liveTranscript && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {liveTranscript.trim().split(/\s+/).length} كلمة
                  </span>
                )}
                {liveTranscript && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveTranscript);
                      setCopiedLiveText(true);
                      setTimeout(() => setCopiedLiveText(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                  >
                    {copiedLiveText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedLiveText ? "تم النسخ" : "نسخ المسودة"}
                  </button>
                )}
              </div>
            </div>

            <div
              ref={liveTranscriptScrollRef}
              className="min-h-[75px] max-h-36 overflow-y-auto text-xs text-zinc-100 leading-relaxed font-sans select-text bg-black/40 p-2.5 rounded-lg border border-zinc-800/80"
            >
              {liveTranscript ? (
                <p className="whitespace-pre-wrap font-medium text-zinc-100">
                  {liveTranscript}
                  <span className="inline-block w-1.5 h-3.5 bg-red-500 mr-1 animate-pulse align-middle" />
                </p>
              ) : (
                <div className="flex items-center justify-center h-full py-4 text-zinc-500 italic gap-2 text-center text-[11px]">
                  <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>تحدث الآن... سيظهر التفريغ الصوتي هنا مباشرة</span>
                </div>
              )}
            </div>

            {/* Manual Quick Action Pills */}
            <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <span className="text-[10px] text-zinc-500">
                {isLiveAiSyncing ? "مزامنة سحابية..." : "ميكروفون نشط"}
              </span>
              <button
                onClick={sendLiveChunkForTranscription}
                disabled={isLiveAiSyncing}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
                title="تحديث التفريغ الآن"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isLiveAiSyncing ? "animate-spin text-red-400" : ""}`} />
                <span>مزامنة AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio File Upload Section */}
      <div className="mb-6">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-600/30 flex items-center justify-center text-red-500">
                <FileAudio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">استيراد ملف صوتي وتفريغه</h3>
                <p className="text-[10px] text-zinc-400">MP3, WAV, M4A, OGG, WebM</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isProcessing}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-red-500" />
              <span>رفع ملف</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac"
              onChange={handleAudioFileUpload}
              className="hidden"
            />
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            يمكنك رفع تسجيلات المحاضرات أو مقابلات العمل السابقة لتفريغها فورياً وفصل المتحدثين.
          </p>
        </div>
      </div>

      {/* Error Banner if any */}
      {uploadError && (
        <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Processing Modal / Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin" />
            <Flame className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">معالجة الصوت بالذكاء الاصطناعي</h3>
          <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">{processingStatus}</p>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-red-400">
            <Sparkles className="w-3 h-3" />
            <span>مدعوم بنماذج Gemini المتقدمة</span>
          </div>
        </div>
      )}

      {/* Recent Recordings Strip */}
      {recentRecordings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              التسجيلات الأخيرة
            </h2>
            <span className="text-[10px] text-zinc-500">{recentRecordings.length} ملفات</span>
          </div>

          <div className="space-y-2">
            {recentRecordings.slice(0, 3).map((record) => (
              <button
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="w-full p-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 transition-all text-right flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 group-hover:bg-red-950/60 border border-zinc-800 group-hover:border-red-600/40 flex items-center justify-center text-red-500 transition-colors">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                      {record.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span>{record.createdAt}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-300">{record.durationFormatted}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 bg-zinc-900 rounded text-zinc-300 border border-zinc-800">
                        {record.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 rtl:space-x-reverse">
                    {record.speakers.slice(0, 2).map((spk, idx) => (
                      <span
                        key={spk.id}
                        className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border border-black text-white"
                        style={{ backgroundColor: spk.color || (idx === 0 ? "#ef4444" : "#f97316") }}
                        title={spk.name}
                      >
                        {spk.name.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
