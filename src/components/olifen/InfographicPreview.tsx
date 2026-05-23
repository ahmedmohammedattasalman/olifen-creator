import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Type, Sparkles, FileText, Check } from "lucide-react";

interface Props {
  loading?: boolean;
  result?: string | null;
}

const SUBJECTS = ["تاريخ", "علوم", "رياضيات", "جغرافيا"];
const LESSON = "الحضارة الإسلامية";
const RESULT_BULLETS = [
  { t: "٦٢٢ م", s: "بداية الهجرة النبوية" },
  { t: "بيت الحكمة", s: "أعظم مكتبة في بغداد" },
  { t: "+١٠٠", s: "عالم مسلم بارز" },
  { t: "٧٥٠ م", s: "بداية العصر العباسي" },
];

const STEPS = [
  { n: "١", title: "اختر المادة", icon: BookOpen, color: "var(--cyan)" },
  { n: "٢", title: "عنوان الدرس", icon: Type, color: "var(--violet)" },
  { n: "٣", title: "اضغط توليد", icon: Sparkles, color: "var(--gold)" },
  { n: "٤", title: "النتيجة", icon: FileText, color: "var(--gold)" },
];

export function InfographicPreview({ loading, result }: Props) {
  // Keep the loading / external result modes for the /generate page.
  if (loading) {
    return (
      <div className="relative rounded-3xl glass p-8 aspect-[3/4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 inset-x-6 text-center text-sm text-muted-foreground">
          جاري توليد إنفوجرافيكك...
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-3xl glass p-6 max-h-[640px] overflow-auto">
        <h4 className="font-display text-2xl text-gradient-gold mb-4">المحتوى المُولَّد</h4>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-body text-foreground">
          {result}
        </pre>
      </div>
    );
  }

  return <HowToUseDemo />;
}

function HowToUseDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* glow */}
      <motion.div
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[var(--gold)]/25 via-[var(--violet)]/20 to-[var(--cyan)]/20 blur-3xl"
        animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.95, 1.02, 0.95] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        className="relative rounded-3xl glass p-6 aspect-[3/4] flex flex-col overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
          <span>كيف تستخدم Olifen</span>
          <span style={{ direction: "ltr" }} className="font-bold text-[var(--gold)]">Olifen</span>
        </div>

        {/* step pills */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              animate={{
                opacity: step === i ? 1 : 0.35,
                scale: step === i ? 1 : 0.96,
              }}
              transition={{ duration: 0.4 }}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-center"
            >
              <div
                className="font-display text-sm font-black"
                style={{ color: step === i ? s.color : undefined }}
              >
                {s.n}
              </div>
              <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                {s.title}
              </div>
            </motion.div>
          ))}
        </div>

        {/* progress bar */}
        <div className="h-1 rounded-full bg-white/5 mb-5 overflow-hidden">
          <motion.div
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-l from-[var(--gold)] via-[var(--violet)] to-[var(--cyan)]"
          />
        </div>

        {/* step content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {step === 0 && <SubjectStep key="s0" />}
            {step === 1 && <LessonStep key="s1" />}
            {step === 2 && <GenerateStep key="s2" />}
            {step === 3 && <ResultStep key="s3" />}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="absolute -inset-4 rounded-[2rem] border border-[var(--gold)]/20 animate-spin-slow pointer-events-none" />
    </div>
  );
}

const stepWrap = {
  initial: { opacity: 0, y: 20, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -20, filter: "blur(8px)" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-widest text-[var(--gold)] font-bold mb-3">
      {children}
    </div>
  );
}

function SubjectStep() {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setPicked(0), 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div {...stepWrap} className="h-full flex flex-col">
      <StepLabel>الخطوة الأولى — المادة</StepLabel>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {SUBJECTS.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`rounded-xl border p-3 flex items-center justify-center text-sm font-bold transition-colors ${
              picked === i
                ? "border-[var(--cyan)]/60 bg-[var(--cyan)]/10 text-foreground"
                : "border-white/10 bg-white/[0.03] text-muted-foreground"
            }`}
          >
            {picked === i && (
              <Check className="h-3.5 w-3.5 ml-1 text-[var(--cyan)]" />
            )}
            {s}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function LessonStep() {
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(LESSON.slice(0, i));
      if (i >= LESSON.length) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div {...stepWrap} className="h-full flex flex-col">
      <StepLabel>الخطوة الثانية — عنوان الدرس</StepLabel>
      <div className="rounded-xl border border-[var(--violet)]/40 bg-white/[0.03] p-4 flex items-center min-h-[64px]">
        <span className="font-display text-lg text-foreground">{text}</span>
        <span className="inline-block w-[2px] h-5 mx-1 bg-[var(--violet)] animate-pulse" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        اكتب عنوان درسك بأي لغة عربية فصيحة.
      </p>
    </motion.div>
  );
}

function GenerateStep() {
  return (
    <motion.div {...stepWrap} className="h-full flex flex-col items-center justify-center">
      <StepLabel>الخطوة الثالثة — التوليد</StepLabel>
      <motion.button
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="relative inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm bg-gradient-to-l from-[var(--gold)] via-[var(--violet)] to-[var(--cyan)] text-background overflow-hidden"
      >
        <Sparkles className="h-4 w-4" />
        توليد الآن
        <motion.span
          className="absolute inset-0 bg-white/30"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
      </motion.button>
      <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        >
          •
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        >
          •
        </motion.span>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        >
          •
        </motion.span>
        <span className="ml-2">يفكر الذكاء الاصطناعي...</span>
      </div>
    </motion.div>
  );
}

function ResultStep() {
  return (
    <motion.div {...stepWrap} className="h-full flex flex-col">
      <StepLabel>الخطوة الرابعة — إنفوجرافيكك</StepLabel>
      <div className="font-display text-xl font-black text-gradient-gold leading-tight mb-3">
        {LESSON}
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {RESULT_BULLETS.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-2.5 flex flex-col justify-center"
          >
            <div className="font-display text-sm font-black text-[var(--gold)] leading-tight">
              {b.t}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {b.s}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
