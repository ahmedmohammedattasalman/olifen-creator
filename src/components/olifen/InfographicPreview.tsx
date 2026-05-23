import { motion } from "framer-motion";

interface Props {
  loading?: boolean;
  result?: string | null;
}

export function InfographicPreview({ loading, result }: Props) {
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

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--gold)]/30 via-[var(--violet)]/20 to-[var(--cyan)]/20 blur-2xl"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-3xl glass p-7 aspect-[3/4] flex flex-col"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span style={{ direction: "ltr" }} className="font-bold text-[var(--gold)]">Olifen</span>
          <span>مادة التاريخ — الصف السادس</span>
        </div>
        <h3 className="font-display text-2xl font-black mb-1 text-gradient-gold">
          الحضارة الإسلامية
        </h3>
        <p className="text-xs text-muted-foreground mb-5">مفاهيم • شخصيات • تاريخ</p>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {[
            { t: "٦٢٢ م", s: "بداية الهجرة" },
            { t: "+١٠٠", s: "عالم مسلم" },
            { t: "٧٥٠", s: "العصر العباسي" },
            { t: "بيت الحكمة", s: "أعظم مكتبة" },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-3 flex flex-col justify-center"
            >
              <div className="font-display text-lg font-black text-[var(--gold)]">{c.t}</div>
              <div className="text-[11px] text-muted-foreground">{c.s}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "78%" }}
            transition={{ duration: 1.4, delay: 0.6 }}
            className="h-full bg-gradient-to-l from-[var(--gold)] via-[var(--violet)] to-[var(--cyan)]"
          />
        </div>
      </motion.div>

      <div className="absolute -inset-4 rounded-[2rem] border border-[var(--gold)]/20 animate-spin-slow pointer-events-none" />
    </div>
  );
}
