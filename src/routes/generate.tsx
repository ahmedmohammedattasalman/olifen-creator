import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Download } from "lucide-react";

import { generateInfographic } from "@/lib/generate.functions";
import { MagneticButton } from "@/components/olifen/MagneticButton";
import { InfographicPreview } from "@/components/olifen/InfographicPreview";

export const Route = createFileRoute("/generate")({
  component: GeneratePage,
  head: () => ({
    meta: [
      { title: "Olifen — مولّد الإنفوجرافيك" },
      { name: "description", content: "ولّد إنفوجرافيكك التعليمي العربي بالذكاء الاصطناعي." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const SUBJECTS = ["تاريخ", "جغرافيا", "علوم", "رياضيات", "لغة عربية", "تربية إسلامية", "لغة إنجليزية"];
const GRADES = Array.from({ length: 12 }).map((_, i) =>
  `الصف ${["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر","الحادي عشر","الثاني عشر"][i]}`
);
const STYLES = [
  { v: "educational", l: "تعليمي كلاسيكي" },
  { v: "modern", l: "حديث وعصري" },
  { v: "minimal", l: "بسيط وأنيق" },
  { v: "playful", l: "مرح وملوّن" },
];

function GeneratePage() {
  const generate = useServerFn(generateInfographic);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[5]);
  const [style, setStyle] = useState(STYLES[0].v);
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lesson.trim().length < 2) {
      toast.error("الرجاء كتابة عنوان الدرس");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { content } = await generate({ data: { subject, lesson, grade, style } });
      setResult(content);
      toast.success("تم توليد الإنفوجرافيك بنجاح!");
    } catch (err: any) {
      toast.error(err?.message ?? "فشل التوليد");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lesson || "olifen-infographic"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] grid place-items-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-xl font-black" style={{ direction: "ltr" }}>
              <span className="text-gradient-gold">Olifen</span>
            </span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            العودة للرئيسية <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 grid lg:grid-cols-[420px_1fr] gap-8">
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={onSubmit}
          className="rounded-3xl glass p-7 space-y-5 h-fit sticky top-24"
        >
          <div>
            <h1 className="font-display text-2xl font-black mb-1">ولّد إنفوجرافيكك</h1>
            <p className="text-sm text-muted-foreground">أدخل تفاصيل الدرس وسنتولّى الباقي.</p>
          </div>

          <Field label="المادة">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={input}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="عنوان الدرس">
            <input
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              placeholder="مثال: موقع مصر الفلكي والجغرافي"
              className={input}
            />
          </Field>

          <Field label="الصف الدراسي">
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={input}>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>

          <Field label="أسلوب التصميم">
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={input}>
              {STYLES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>

          <MagneticButton variant="primary" type="submit" disabled={loading} className="w-full">
            {loading ? "جاري التوليد..." : "توليد الآن"}
            <Sparkles className="h-4 w-4" />
          </MagneticButton>

          {result && (
            <button
              type="button"
              onClick={download}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-sm border border-border hover:bg-white/5"
            >
              <Download className="h-4 w-4" />
              تحميل المحتوى
            </button>
          )}
        </motion.form>

        <div>
          <InfographicPreview loading={loading} result={result} />
        </div>
      </div>
    </main>
  );
}

const input =
  "w-full bg-input/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold mb-2 block">{label}</span>
      {children}
    </label>
  );
}
