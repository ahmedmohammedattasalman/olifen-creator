import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent?: "gold" | "violet" | "cyan";
}

const accentMap = {
  gold: "from-[var(--gold)]/30 to-[var(--gold)]/0 text-[var(--gold)]",
  violet: "from-[var(--violet)]/30 to-[var(--violet)]/0 text-[var(--violet)]",
  cyan: "from-[var(--cyan)]/30 to-[var(--cyan)]/0 text-[var(--cyan)]",
};

export function FeatureCard({ icon: Icon, title, desc, accent = "gold" }: Props) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative rounded-2xl glass p-7 transition-shadow hover:shadow-[0_0_0_1px_rgba(200,169,126,0.4),0_20px_60px_-20px_rgba(200,169,126,0.35)]"
    >
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${accentMap[accent]} grid place-items-center mb-5`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}
