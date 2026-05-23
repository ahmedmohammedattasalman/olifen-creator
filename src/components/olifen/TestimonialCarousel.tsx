import { Star } from "lucide-react";

const items = [
  {
    name: "سارة الحربي",
    role: "معلمة تاريخ — الرياض",
    quote: "وفّرت Olifen عليّ ساعات من التحضير. الإنفوجرافيك يخرج بجودة احترافية وطلابي يتفاعلون معه أكثر بكثير.",
  },
  {
    name: "محمد عبدالله",
    role: "معلم علوم — القاهرة",
    quote: "أداة استثنائية. أكتب الدرس وأحصل على تصميم جاهز للطباعة خلال ثلاثين ثانية، باللغة العربية وبتصميم متقن.",
  },
  {
    name: "فاطمة المنصوري",
    role: "معلمة لغة عربية — دبي",
    quote: "أخيراً منصة عربية بجدية. التصاميم أنيقة، RTL مظبوط، والذكاء الاصطناعي يفهم المحتوى التعليمي حقاً.",
  },
];

export function TestimonialCarousel() {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden pause-on-hover" dir="ltr">
      <div className="flex gap-6 w-max animate-marquee">
        {doubled.map((t, i) => (
          <article
            key={i}
            className="glass rounded-2xl p-6 w-[340px] md:w-[400px] shrink-0"
            dir="rtl"
          >
            <div className="flex gap-1 mb-3 text-[var(--gold)]">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4">{t.quote}</p>
            <div className="text-sm font-bold">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
