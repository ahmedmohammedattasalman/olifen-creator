import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "هل Olifen مجاني؟", a: "نعم، نوفّر خطة مجانية تتيح لك توليد ٣ إنفوجرافيكات شهرياً دون أي تكلفة. للاستخدام المكثف يمكنك الترقية لخطة Starter أو Pro." },
  { q: "هل التصاميم باللغة العربية بالكامل؟", a: "نعم، جميع التصاميم باللغة العربية مع دعم كامل لـ RTL واستخدام خطوط عربية احترافية مثل Cairo و Tajawal." },
  { q: "هل يمكنني طباعة الإنفوجرافيك؟", a: "بالتأكيد. كل التصاميم تُصدَّر بجودة عالية مناسبة للطباعة بأحجام A4 و A3." },
  { q: "ما المواد الدراسية المدعومة؟", a: "نحن ندعم جميع المواد: التاريخ، الجغرافيا، العلوم، الرياضيات، اللغة العربية، التربية الإسلامية، اللغة الإنجليزية، وغيرها." },
  { q: "كم يستغرق توليد إنفوجرافيك واحد؟", a: "حوالي ٣٠ ثانية في المتوسط. السرعة قد تختلف حسب تعقيد الدرس وطول المحتوى." },
  { q: "هل يمكنني تعديل التصميم بعد التوليد؟", a: "نعم، توفر خطة Pro محرراً يتيح لك تغيير الألوان والخطوط وترتيب العناصر بسهولة." },
  { q: "هل بياناتي وأفكاري محمية؟", a: "نعم، نلتزم بأعلى معايير الخصوصية. محتواك التعليمي ملكك ولا يُستخدم في تدريب أي نماذج." },
  { q: "هل تدعمون المعلمين بشكل جماعي للمدارس؟", a: "نعم، لدينا خطط خاصة بالمدارس والمؤسسات التعليمية مع خصومات على الكميات. تواصل معنا لمعرفة المزيد." },
];

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-2xl glass overflow-hidden transition-colors ${
              isOpen ? "border-gold/50" : ""
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-right"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-base">{f.q}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="h-5 w-5 text-[var(--gold)]" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
