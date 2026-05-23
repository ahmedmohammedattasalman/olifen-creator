import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, Palette, Download, Pencil, ArrowLeft, Star,
  Languages, Wand2, GraduationCap, Printer, Infinity as InfinityIcon, Brush,
} from "lucide-react";

import { Navbar } from "@/components/olifen/Navbar";
import { ParticleCanvas } from "@/components/olifen/ParticleCanvas";
import { MagneticButton } from "@/components/olifen/MagneticButton";
import { CounterStat } from "@/components/olifen/CounterStat";
import { FeatureCard } from "@/components/olifen/FeatureCard";
import { PricingCard, type Plan } from "@/components/olifen/PricingCard";
import { TestimonialCarousel } from "@/components/olifen/TestimonialCarousel";
import { FAQAccordion } from "@/components/olifen/FAQAccordion";
import { InfographicPreview } from "@/components/olifen/InfographicPreview";
import IntroOverlay from "@/components/olifen/IntroOverlay";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Olifen — حوّل دروسك إلى إنفوجرافيك احترافي" },
      { name: "description", content: "منصة Olifen تستخدم الذكاء الاصطناعي لتحويل دروسك إلى إنفوجرافيك تعليمي عربي احترافي في ثوانٍ." },
      { property: "og:title", content: "Olifen — إنفوجرافيك تعليمي بالعربية" },
      { property: "og:description", content: "ابدأ مجاناً وحوّل دروسك إلى تصاميم عربية احترافية." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const phrases = [
  "لمعلمي التاريخ والجغرافيا...",
  "لمعلمي العلوم والرياضيات...",
  "لمعلمي اللغة العربية والتربية الإسلامية...",
];

function useTypewriter() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[idx];
    const speed = deleting ? 30 : 55;
    if (!deleting && text === full) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(() => {
      setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, idx]);

  return text;
}

import type { Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

function Landing() {
  const typed = useTypewriter();

  return (
    <main className="bg-background text-foreground">
      <IntroOverlay />
      <Navbar />

      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[100svh] pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <ParticleCanvas />
        <div className="absolute -top-32 right-1/4 h-[420px] w-[420px] rounded-full bg-[var(--violet)]/30 blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 h-[380px] w-[380px] rounded-full bg-[var(--gold)]/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[var(--cyan)]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="show" variants={container} className="text-center lg:text-right">
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span className="font-bold" style={{ direction: "ltr" }}>Olifen</span>
              <span className="text-muted-foreground">— الإنفوجرافيك التعليمي العربي</span>
            </motion.div>

            <motion.h1 variants={item} className="mt-6 text-5xl md:text-6xl lg:text-[64px] leading-[1.1] font-display font-black">
              حوّل دروسك إلى{" "}
              <span className="text-gradient-gold">إنفوجرافيك احترافي</span>{" "}
              في ثوانٍ
            </motion.h1>

            <motion.p variants={item} className="mt-6 text-lg text-muted-foreground min-h-[1.75rem]">
              {typed}
              <span className="inline-block w-[2px] h-5 align-middle bg-[var(--gold)] animate-pulse mx-1" />
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
              <Link to="/generate">
                <MagneticButton variant="primary">
                  ابدأ مجاناً
                  <ArrowLeft className="h-4 w-4" />
                </MagneticButton>
              </Link>
              <a href="#features">
                <MagneticButton variant="ghost">المميزات</MagneticButton>
              </a>
            </motion.div>

            <motion.div variants={item} className="mt-8 flex items-center justify-center lg:justify-start gap-3 text-sm text-muted-foreground">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
                ))}
              </div>
              <span>يستخدمه أكثر من ٥٠٠ معلم</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <InfographicPreview />
          </motion.div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <Section id="how" eyebrow="كيف يعمل؟" title="ثلاث خطوات تفصلك عن إنفوجرافيكك">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative grid md:grid-cols-3 gap-6"
        >
          <div className="hidden md:block absolute top-12 right-[16%] left-[16%] h-px bg-gradient-to-l from-[var(--cyan)] via-[var(--violet)] to-[var(--gold)]" />
          {[
            { n: "١", icon: Pencil, title: "أدخل المادة والدرس", desc: "اكتب موضوعك وحدد الصف والمادة بسهولة.", c: "text-[var(--cyan)]" },
            { n: "٢", icon: Palette, title: "اختر أسلوب التصميم", desc: "أساليب متعددة تناسب كل مادة وفئة عمرية.", c: "text-[var(--violet)]" },
            { n: "٣", icon: Download, title: "حمّل إنفوجرافيكك", desc: "تصميم جاهز للطباعة A3 أو للمشاركة الرقمية.", c: "text-[var(--gold)]" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.n} variants={item} className="relative rounded-2xl glass p-7 text-center">
                <div className={`mx-auto h-14 w-14 rounded-2xl bg-white/5 grid place-items-center mb-4 ${s.c}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="font-display text-3xl font-black text-gradient-gold mb-1">{s.n}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ───────── FEATURES ───────── */}
      <Section id="features" eyebrow="لماذا Olifen؟" title="مصمَّمة خصيصاً للمعلم العربي">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <FeatureCard icon={Brush} accent="gold"   title="تصاميم بمستوى المحترفين"  desc="نتائج بصرية مذهلة بدون أي معرفة بالتصميم. خطوط وألوان ومسافات مدروسة." />
          <FeatureCard icon={Languages} accent="violet" title="عربي بالكامل RTL" desc="دعم كامل للغة العربية، خطوط Cairo و Tajawal، واتجاه من اليمين لليسار." />
          <FeatureCard icon={Wand2} accent="cyan"   title="توليد بالذكاء الاصطناعي" desc="نماذج ذكاء اصطناعي حديثة تفهم المحتوى التعليمي وتنظمه بصرياً." />
          <FeatureCard icon={GraduationCap} accent="gold" title="جميع المواد الدراسية" desc="من التاريخ والعلوم إلى الرياضيات واللغة العربية والتربية الإسلامية." />
          <FeatureCard icon={Printer} accent="violet" title="جاهز للطباعة A3" desc="تصدير بدقة عالية مناسب لطباعة لوحات الفصول واللوحات التوضيحية." />
          <FeatureCard icon={InfinityIcon} accent="cyan" title="غير محدود في خطة Pro" desc="ولّد كل ما تحتاجه، بدون قيود يومية أو شهرية على الإنفوجرافيكات." />
        </motion.div>
      </Section>

      {/* ───────── LIVE DEMO ───────── */}
      <Section id="demo" eyebrow="جرّبها الآن" title="ولّد نموذجك الأول مجاناً">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <DemoForm />
          <div>
            <InfographicPreview />
          </div>
        </div>
      </Section>

      {/* ───────── STATS ───────── */}
      <section className="relative py-20 mt-10 border-y border-border bg-gradient-to-l from-[var(--gold)]/5 via-transparent to-[var(--violet)]/5">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <CounterStat value={500} prefix="+" label="معلم يستخدم Olifen" />
          <CounterStat value={2000} prefix="+" label="إنفوجرافيك تم توليده" />
          <CounterStat value={98} suffix="٪" label="نسبة الرضا" />
          <CounterStat value={30} suffix=" ث" label="متوسط وقت التوليد" />
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <PricingSection />

      {/* ───────── TESTIMONIALS ───────── */}
      <Section id="testimonials" eyebrow="آراء المعلمين" title="ماذا يقول معلمونا؟">
        <TestimonialCarousel />
      </Section>

      {/* ───────── FAQ ───────── */}
      <Section id="faq" eyebrow="أسئلة شائعة" title="كل ما تودّ معرفته">
        <FAQAccordion />
      </Section>

      {/* ───────── CTA ───────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--violet)]/30 via-[var(--violet)]/10 to-[var(--gold)]/20" />
        <div className="absolute top-10 right-1/3 h-80 w-80 rounded-full bg-[var(--gold)]/30 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[var(--violet)]/40 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-5">
            جاهز لتحويل <span className="text-gradient-gold">دروسك</span>؟
          </h2>
          <p className="text-muted-foreground mb-8">
            انضم لمئات المعلمين الذين يوفّرون ساعات أسبوعياً مع Olifen.
          </p>
          <Link to="/generate">
            <MagneticButton variant="primary">
              ابدأ مجاناً الآن
              <ArrowLeft className="h-4 w-4" />
            </MagneticButton>
          </Link>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <Footer />
    </main>
  );
}

function Section({
  id, eyebrow, title, children,
}: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-block text-xs font-bold tracking-widest text-[var(--gold)] uppercase mb-3">
            {eyebrow}
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black">
            {title}
          </h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function DemoForm() {
  // Light, frontend-only demo form. Real generation lives on /generate.
  return (
    <form
      className="rounded-3xl glass p-7 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.assign("/generate");
      }}
    >
      <div>
        <label className="text-sm font-bold mb-2 block">المادة</label>
        <select className="w-full bg-input/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40">
          {["تاريخ", "جغرافيا", "علوم", "رياضيات", "لغة عربية", "تربية إسلامية"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-bold mb-2 block">عنوان الدرس</label>
        <input
          type="text"
          placeholder="مثال: موقع مصر الفلكي والجغرافي"
          className="w-full bg-input/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
        />
      </div>
      <div>
        <label className="text-sm font-bold mb-2 block">الصف الدراسي</label>
        <select className="w-full bg-input/60 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40">
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i}>الصف {["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر","الحادي عشر","الثاني عشر"][i]}</option>
          ))}
        </select>
      </div>
      <MagneticButton variant="primary" className="w-full">
        توليد نموذج
        <Sparkles className="h-4 w-4" />
      </MagneticButton>
    </form>
  );
}

function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const plans: Plan[] = [
    {
      name: "FREE",
      price: { monthly: 0, yearly: 0 },
      unit: "USD",
      limit: "٣ إنفوجرافيكات شهرياً",
      features: ["جميع القوالب الأساسية", "تصدير PNG بجودة عالية", "دعم العربية الكامل"],
      cta: "ابدأ مجاناً",
    },
    {
      name: "STARTER",
      badge: "الأكثر طلباً",
      recommended: true,
      price: { monthly: 7, yearly: 67 },
      unit: "USD",
      limit: "٣٠ إنفوجرافيك شهرياً",
      features: ["كل ميزات FREE", "تصدير PDF عالي الدقة", "أنماط تصميم متقدمة", "دعم فني سريع"],
      cta: "اختر Starter",
    },
    {
      name: "PRO",
      price: { monthly: 15, yearly: 144 },
      unit: "USD",
      limit: "غير محدود",
      features: ["كل ميزات Starter", "محرر تصميم متقدم", "قوالب مدرسية مخصصة", "ترخيص للمؤسسات"],
      cta: "اختر Pro",
    },
  ];

  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-widest text-[var(--gold)] uppercase mb-3">الأسعار</div>
          <h2 className="font-display text-3xl md:text-5xl font-black mb-6">خطط بسيطة وشفافة</h2>

          <div className="inline-flex relative items-center p-1 rounded-full glass" dir="ltr">
            {[
              { k: false, label: "شهري" },
              { k: true, label: "سنوي" },
            ].map((opt) => (
              <button
                key={String(opt.k)}
                onClick={() => setYearly(opt.k)}
                className={`relative z-10 px-5 py-2 text-sm font-bold transition-colors ${
                  yearly === opt.k ? "text-background" : "text-muted-foreground"
                }`}
              >
                {opt.label}
                {opt.k && yearly && (
                  <span className="mr-2 inline-block px-2 py-0.5 rounded-full bg-background/20 text-[10px]">
                    وفّر ٢٠٪
                  </span>
                )}
              </button>
            ))}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute inset-y-1 rounded-full bg-[var(--gold)]"
              style={{ left: yearly ? "50%" : 4, right: yearly ? 4 : "50%" }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((p) => (
            <PricingCard key={p.name} plan={p} yearly={yearly} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] grid place-items-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-xl font-black" style={{ direction: "ltr" }}>
              <span className="text-gradient-gold">Olifen</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            منصة الإنفوجرافيك التعليمي العربي بالذكاء الاصطناعي.
          </p>
        </div>

        <FooterCol title="المنتج" links={[
          { href: "#features", label: "المميزات" },
          { href: "#pricing",  label: "الأسعار" },
          { href: "#demo",     label: "جرّبها الآن" },
        ]} />
        <FooterCol title="الشركة" links={[
          { href: "#faq", label: "أسئلة شائعة" },
          { href: "#",    label: "من نحن" },
          { href: "#",    label: "المدونة" },
        ]} />
        <FooterCol title="قانوني" links={[
          { href: "#", label: "الشروط والأحكام" },
          { href: "#", label: "سياسة الخصوصية" },
          { href: "#", label: "تواصل معنا" },
        ]} />
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © ٢٠٢٦ <span style={{ direction: "ltr" }}>Olifen</span> — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="text-sm font-bold mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
