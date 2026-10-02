export type RecordingMode =
  | "student" // طالب / أكاديمي
  | "journalist" // صحفي / مقابلات
  | "professional" // أعمال / اجتماعات
  | "creator" // صانع محتوى / بودكاست
  | "accessibility"; // دعم السمع / الصم

export type Category =
  | "محاضرة"
  | "مقابلة"
  | "اجتماع عمل"
  | "محتوى"
  | "ملاحظة سريعة"
  | "أخرى";

export interface Speaker {
  id: string;
  name: string;
  color: string;
  role?: string;
}

export interface Paragraph {
  id: string;
  speakerId: string;
  speakerName: string;
  timestamp: string; // e.g. "01:24"
  seconds: number;
  text: string;
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
  priority?: "high" | "medium" | "low";
}

export interface SentimentAnalysis {
  label: "إيجابي" | "محايد" | "سلبي" | "حماسي" | "رسمي";
  score: number; // 0 - 100
  toneDescription: string;
  keywords: string[];
}

export interface Chapter {
  id: string;
  title: string;
  startSeconds: number;
  timestamp: string; // e.g. "02:15"
  summary: string;
  keyTakeaway?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MindMapBranch {
  id: string;
  title: string;
  color?: string;
  items: string[];
}

export interface MindMapData {
  centralTheme: string;
  branches: MindMapBranch[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestampRef?: string;
  secondsRef?: number;
  createdAt: string;
}

export interface TranscriptionRecord {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  durationFormatted: string;
  category: Category;
  mode: RecordingMode;
  tags: string[];
  speakers: Speaker[];
  paragraphs: Paragraph[];
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  sentiment: SentimentAnalysis;
  audioUrl?: string;
  audioBlob?: Blob;
  wpm?: number;
  noiseFiltered?: boolean;
  silenceRemoved?: boolean;
  notes?: string;
  starred?: boolean;
  chapters?: Chapter[];
  mindMap?: MindMapData;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  chatHistory?: ChatMessage[];
}

export interface AppSettings {
  dialect: string;
  noiseSuppression: boolean;
  silenceRemoval: boolean;
  autoPunctuation: boolean;
  deafModeHighContrast: boolean;
  fontSizePreference: "normal" | "large" | "extra-large";
  visualAlerts: boolean;
  vibrationAlerts: boolean;
  alertKeywords: string[];
  saveAudioLocally: boolean;
}
