import { motion } from "framer-motion";
import sample1 from "@/assets/sample-motherboard.png";
import sample2 from "@/assets/sample-relative-speed.png";
import sample3 from "@/assets/sample-jet-engine.png";
import sample4 from "@/assets/sample-calculus.png";

const samples = [
  { img: sample1, subject: "الحاسوب", lesson: "اللوحة الأم" },
  { img: sample2, subject: "الفيزياء", lesson: "السرعة النسبية" },
  { img: sample3, subject: "الهندسة", lesson: "كيف يعمل محرك الطائرة" },
  { img: sample4, subject: "الرياضيات", lesson: "التفاضل" },
];

export function SamplesGallery() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {samples.map((s, i) => (
        <motion.figure
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6 }}
          className="group relative rounded-2xl overflow-hidden glass border border-white/10"
        >
          <div className="relative overflow-hidden aspect-[9/16] bg-black/40">
            <img
              src={s.img}
              alt={`${s.subject} — ${s.lesson}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
          </div>
          <figcaption className="absolute bottom-0 inset-x-0 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] mb-1">
              {s.subject}
            </div>
            <div className="font-display text-lg font-bold text-foreground leading-tight">
              {s.lesson}
            </div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

export default SamplesGallery;
