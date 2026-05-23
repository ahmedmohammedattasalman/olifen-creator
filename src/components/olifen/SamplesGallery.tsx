import { motion } from "framer-motion";
import sampleComputer from "@/assets/sample-computer.jpeg";
import sampleAlternator from "@/assets/sample-alternator.jpeg";
import sampleStory from "@/assets/sample-story.jpeg";

const samples = [
  { src: sampleComputer, title: "شرح الهارد وير لجهاز كومبيوتر مكتبي", tag: "علوم الحاسب" },
  { src: sampleAlternator, title: "مولّد التيار للسيارة", tag: "هندسة ميكانيكية" },
  { src: sampleStory, title: "قصة حقيقية — رحلة الأمل والعاصفة", tag: "سرد قصصي" },
];

export function SamplesGallery() {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {samples.map((s, i) => (
        <motion.figure
          key={i}
          variants={{
            hidden: { opacity: 0, y: 40 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
          }}
          whileHover={{ y: -8 }}
          className="group relative rounded-3xl overflow-hidden glass border border-white/10"
        >
          <div className="absolute -inset-1 bg-gradient-to-br from-[var(--gold)]/30 via-[var(--violet)]/20 to-[var(--cyan)]/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />
          <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
            <img
              src={s.src}
              alt={s.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
            <span className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full bg-background/70 backdrop-blur border border-white/10 text-[var(--gold)]">
              {s.tag}
            </span>
          </div>
          <figcaption className="absolute bottom-0 inset-x-0 p-5">
            <h3 className="font-display font-black text-lg leading-snug">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              نموذج تم توليده عبر <span style={{ direction: "ltr" }} className="text-[var(--gold)] font-bold">Olifen</span>
            </p>
          </figcaption>
        </motion.figure>
      ))}
    </motion.div>
  );
}
