import { TranscriptionRecord, AppSettings } from "../types";

export const INITIAL_RECORDINGS: TranscriptionRecord[] = [
  {
    id: "rec-1",
    title: "محاضرة: بنية معالجة اللغات الطبيعية ونماذج المحولات (Transformers)",
    createdAt: "اليوم 10:30 ص",
    durationSeconds: 185,
    durationFormatted: "03:05",
    category: "محاضرة",
    mode: "student",
    tags: ["ذكاء اصطناعي", "معالجة لغات", "محاضرات", "حاسوب"],
    speakers: [
      { id: "spk-1", name: "د. عبد الرحمن السعدي", color: "#ef4444", role: "المحاضر" },
      { id: "spk-2", name: "طالب (سؤال)", color: "#f97316", role: "مشارك" },
    ],
    paragraphs: [
      {
        id: "p-1",
        speakerId: "spk-1",
        speakerName: "د. عبد الرحمن السعدي",
        timestamp: "00:00",
        seconds: 0,
        text: "أهلاً بكم جميعاً في محاضرة اليوم حول تطور معمارية نماذج التعلم العميق في معالجة الصوت والنصوص العربية.",
      },
      {
        id: "p-2",
        speakerId: "spk-1",
        speakerName: "د. عبد الرحمن السعدي",
        timestamp: "00:32",
        seconds: 32,
        text: "النقطة الجوهرية التي أحدثت ثورة حقيقية هي آلية الانتباه الذاتي (Self-Attention) واستبدال النماذج المتكررة القديمة بشبكات المحولات الفائقة السرعة.",
      },
      {
        id: "p-3",
        speakerId: "spk-2",
        speakerName: "طالب (سؤال)",
        timestamp: "01:10",
        seconds: 70,
        text: "دكتور، هل ينطبق تفوق معمارية المحولات على نماذج التعرف على الكلام واللهجات العامية أيضاً بنفس الفعالية؟",
      },
      {
        id: "p-4",
        speakerId: "spk-1",
        speakerName: "د. عبد الرحمن السعدي",
        timestamp: "01:38",
        seconds: 98,
        text: "سؤال ممتاز جداً! نعم، نماذج مثل Conformer و Whisper و Gemini تعتمد كلياً على المحولات لترميز الترددات الصوتية وفهم الفروقات الصوتية بدقة متناهية.",
      },
      {
        id: "p-5",
        speakerId: "spk-1",
        speakerName: "د. عبد الرحمن السعدي",
        timestamp: "02:25",
        seconds: 145,
        text: "في الاختبار العملي القادم، سنقوم بتطبيق خوارزمية فصل المتحدثين وبناء خط أنابيب كامل للنسخ الآلي مع معالجة الضوضاء في الخلفية.",
      },
    ],
    summary:
      "شرح مفصل لبنية شبكات المحولات (Transformers) وآلية الانتباه الذاتي، مع استعراض تطبيقاتها العملية في التعرف الآلي على الكلام واللهجات العربية مقارنة بالشبكات المتكررة التقليدية.",
    keyPoints: [
      "الانتباه الذاتي يوفر معالجة متوازية أسرع بكثير من الشبكات التكرارية القديمة.",
      "تطبيق المحولات على الصوت أتاح فهماً دقيقاً للسمات الصوتية المتغيرة واللهجات المتعددة.",
      "الواجب القادم يشمل بناء نموذج تدريبي مصغر لفصل المتحدثين."
    ],
    actionItems: [
      { id: "act-1", text: "مراجعة ورقة عمل Attention Is All You Need", done: true, priority: "high" },
      { id: "act-2", text: "تسليم كود تطبيق فصل المتحدثين يوم الخميس", done: false, priority: "high" },
      { id: "act-3", text: "تنزيل مجموعة بيانات الأصوات العربية المفتوحة", done: false, priority: "medium" },
    ],
    sentiment: {
      label: "حماسي",
      score: 92,
      toneDescription: "أكاديمي تفاعلي، واضح ومحفز للبحث العلمي.",
      keywords: ["محولات", "تعلم عميق", "صوتيات", "انتباه ذاتي", "خوارزميات"],
    },
    wpm: 142,
    noiseFiltered: true,
    silenceRemoved: true,
  },
  {
    id: "rec-2",
    title: "حوار صحفي: مستقبل الطاقة المتجددة ومشاريع الهيدروجين الأخضر 2030",
    createdAt: "أمس 04:15 م",
    durationSeconds: 154,
    durationFormatted: "02:34",
    category: "مقابلة",
    mode: "journalist",
    tags: ["صحافة", "طاقة", "اقتصاد", "حوار"],
    speakers: [
      { id: "spk-1", name: "المحاور (ياسر)", color: "#ef4444", role: "صحفي" },
      { id: "spk-2", name: "م. نورة القحطاني", color: "#e11d48", role: "خبير استشاري" },
    ],
    paragraphs: [
      {
        id: "p-21",
        speakerId: "spk-1",
        speakerName: "المحاور (ياسر)",
        timestamp: "00:00",
        seconds: 0,
        text: "أهلاً بكِ مهندسة نورة. كيف ترين تسارع الاستثمارات في مجمعات الطاقة الشمسية والهيدروجين في منطقتنا حالياً؟",
      },
      {
        id: "p-22",
        speakerId: "spk-2",
        speakerName: "م. نورة القحطاني",
        timestamp: "00:28",
        seconds: 28,
        text: "نحن نشهد نقلة استراتيجية غير مسبوقة، حيث تجاوزت كفاءة الخلايا الشمسية أرقاماً قياسية مع انخفاض تكلفة الكيلوواط إلى مستويات تنافسية عالمية.",
      },
      {
        id: "p-23",
        speakerId: "spk-1",
        speakerName: "المحاور (ياسر)",
        timestamp: "01:05",
        seconds: 65,
        text: "وما هي أبرز التحديات اللوجستية التي تواجه خطوط تصدير الهيدروجين إلى الأسواق الأوروبية والآسيوية؟",
      },
      {
        id: "p-24",
        speakerId: "spk-2",
        speakerName: "م. نورة القحطاني",
        timestamp: "01:25",
        seconds: 85,
        text: "التحدي الرئيسي كان في تكنولوجيا التبريد والناقلات الآمنة، ولكن الاتفاقيات الأخيرة تضمن تدفق الإمدادات عبر موانئ متطورة بحلول عام 2028.",
      },
    ],
    summary:
      "مقابلة صحفية تناقش مؤشرات نمو الطاقة النظيفة، تقنيات الهيدروجين الأخضر، واستعداد الموانئ اللوجستية للتصدير العالمي بحلول عام 2028.",
    keyPoints: [
      "انخفاض تكلفة إنتاج الطاقة الشمسية جعل المشاريع الإقليمية الأكثر تنافسية في العالم.",
      "تطوير تقنيات النقل البحري الآمن حل أكبر معضلات تصدير الهيدروجين.",
      "توقعات بارتفاع العائدات الاقتصادية مع التشغيل التجاري الكامل."
    ],
    actionItems: [
      { id: "act-21", text: "صياغة التقرير الصحفي النهائي للنشر في المجلة", done: false, priority: "high" },
      { id: "act-22", text: "إرسال الاقتباسات للمهندسة نورة للاعتماد النهائي", done: false, priority: "medium" },
    ],
    sentiment: {
      label: "إيجابي",
      score: 89,
      toneDescription: "مهني واثق ومستشرف لفرص النمو والتنمية.",
      keywords: ["هيدروجين أخضر", "طاقة شمسية", "استدامة", "تصدير"],
    },
    wpm: 136,
    noiseFiltered: true,
    silenceRemoved: false,
  },
  {
    id: "rec-3",
    title: "اجتماع الإدارة: استراتيجية المنتج وخطة إطلاق النسخة الجديدة",
    createdAt: "09 مارس 01:20 م",
    durationSeconds: 120,
    durationFormatted: "02:00",
    category: "اجتماع عمل",
    mode: "professional",
    tags: ["إدارة", "تقنية", "منتج", "تسويق"],
    speakers: [
      { id: "spk-1", name: "سارة (مديرة المنتج)", color: "#ef4444", role: "رئيس الجلسة" },
      { id: "spk-2", name: "طارق (رئيس الهندسة)", color: "#b91c1c", role: "فريق التطوير" },
    ],
    paragraphs: [
      {
        id: "p-31",
        speakerId: "spk-1",
        speakerName: "سارة (مديرة المنتج)",
        timestamp: "00:00",
        seconds: 0,
        text: "هدف اجتماعنا اليوم هو حسم تاريخ إطلاق النسخة الرسمية ومراجعة نتائج اختبارات الأداء وسرعة الاستجابة.",
      },
      {
        id: "p-32",
        speakerId: "spk-2",
        speakerName: "طارق (رئيس الهندسة)",
        timestamp: "00:26",
        seconds: 26,
        text: "نجحنا في تقليص زمن التفريغ الصوتي المباشر بنسبة 45% بفضل التخزين المؤقت وتحسين معالجة الذبذبات على الخادم.",
      },
      {
        id: "p-33",
        speakerId: "spk-1",
        speakerName: "سارة (مديرة المنتج)",
        timestamp: "00:45",
        seconds: 45,
        text: "ممتاز جداً! سنعتمد موعد الإطلاق في الأول من الشهر القادم مع إتاحة فترة تجريبية مجانية لجميع المستخدمين الأوائل.",
      },
    ],
    summary:
      "اعتماد موعد إطلاق التحديث الرئيسي بعد إتمام التحسينات التقنية وتقليص زمن الاستجابة، مع خطة حملة تسويقية موجهة للمستخدمين.",
    keyPoints: [
      "تحسن زمن معالجة الصوت بنسبة 45% في الاختبارات المعيارية.",
      "تحديد يوم 1 الشهر القادم موعداً رسمياً للإطلاق التجاري.",
      "تجهيز العروض الخاصة للعملاء الحاليين."
    ],
    actionItems: [
      { id: "act-31", text: "إعداد بيان الإطلاق الصحفي والتواصل مع الشركاء", done: true, priority: "high" },
      { id: "act-32", text: "تجهيز خوادم التوسع الاحتياطية لتفادي أي ضغط مفاجئ", done: false, priority: "high" },
    ],
    sentiment: {
      label: "رسمي",
      score: 95,
      toneDescription: "حاسم، تنفيذي، وعالي التنظيم والوضوح.",
      keywords: ["إطلاق", "تحسين أداء", "منتج", "اختبارات"],
    },
    wpm: 128,
    noiseFiltered: true,
    silenceRemoved: true,
  },
  {
    id: "rec-4",
    title: "حلقة بودكاست: 5 أسرار لصناعة المحتوى الرقمي المؤثر في 2026",
    createdAt: "07 مارس 08:45 م",
    durationSeconds: 140,
    durationFormatted: "02:20",
    category: "محتوى",
    mode: "creator",
    tags: ["بودكاست", "يوتيوب", "سوشيال ميديا", "صوتيات"],
    speakers: [
      { id: "spk-1", name: "ماجد (مقدم البرنامج)", color: "#ef4444", role: "المضيف" },
    ],
    paragraphs: [
      {
        id: "p-41",
        speakerId: "spk-1",
        speakerName: "ماجد (مقدم البرنامج)",
        timestamp: "00:00",
        seconds: 0,
        text: "مرحباً بكم يا أصدقاء في حلقة استثنائية! السر الأول الذي يغفل عنه 90% من صناع المحتوى هو هندسة الصوت ونقائه.",
      },
      {
        id: "p-42",
        speakerId: "spk-1",
        speakerName: "ماجد (مقدم البرنامج)",
        timestamp: "00:35",
        seconds: 35,
        text: "المشاهد قد يتسامح مع دقة صورة متواضعة، لكنه يغادر الفيديو فوراً إذا كان الصوت مليئاً بالضوضاء أو الصدى المزعج.",
      },
      {
        id: "p-43",
        speakerId: "spk-1",
        speakerName: "ماجد (مقدم البرنامج)",
        timestamp: "01:15",
        seconds: 75,
        text: "لذلك احرص دائماً على تسجيل نصوص حلقاتك مسبقاً وتفريغها واستخراج النقاط الذهبية لتحويلها إلى مقاطع قصيرة وفيروسية.",
      },
    ],
    summary:
      "نصائح عملية لصناع المحتوى حول أهمية جودة ونقاء الصوت الصوتي كعامل حاسم في جذب المشاهدين، واستراتيجيات إعادة تدوير المحتوى الصوتي لنصوص ومقاطع ريلز.",
    keyPoints: [
      "نقاء الصوت هو العامل رقم 1 في بقاء المستمع والمشاهد.",
      "تفريغ المقاطع إلى نصوص يضاعف إمكانية نشر محتوى متعدد المنصات.",
      "الاستثمار في عزل الصوت يوفر ساعات طويلة من المونتاج."
    ],
    actionItems: [
      { id: "act-41", text: "استخراج 3 اقتباسات ملهمة وتحويلها إلى منشورات تويتر ولينكد إن", done: false, priority: "high" },
      { id: "act-42", text: "توليد ملف الترجمة SRT ودمجه مع الفيديو القصير", done: false, priority: "medium" },
    ],
    sentiment: {
      label: "حماسي",
      score: 96,
      toneDescription: "عفوي وجذاب وممتلئ بالطاقة الإيجابية التفاعلية.",
      keywords: ["بودكاست", "ريلز", "صناع محتوى", "هندسة صوت"],
    },
    wpm: 155,
    noiseFiltered: true,
    silenceRemoved: true,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  dialect: "ar-SA",
  noiseSuppression: true,
  silenceRemoval: true,
  autoPunctuation: true,
  deafModeHighContrast: true,
  fontSizePreference: "large",
  visualAlerts: true,
  vibrationAlerts: true,
  alertKeywords: ["انتباه", "مهم", "خطر", "طارئ", "نقطة جوهرية", "سؤال", "ملاحظة"],
  saveAudioLocally: true,
};

// Aliases
export const initialRecordings = INITIAL_RECORDINGS;
export const initialSettings = DEFAULT_SETTINGS;
