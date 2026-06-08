import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function IntroOverlay() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* glow */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-[520px] w-[520px] rounded-full bg-violet/30 blur-[120px]"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-[380px] w-[380px] rounded-full bg-gold/25 blur-[100px]"
          />

          {/* sweep line */}
          <motion.div
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-1/2 h-px w-[140%] bg-gradient-to-r from-transparent via-gold to-transparent"
          />

          <div className="relative flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 backdrop-blur-sm"
            >
              <Sparkles className="h-7 w-7 text-[var(--gold)]" />
            </motion.div>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-6xl md:text-7xl font-bold tracking-tight text-gradient-gold"
                style={{ direction: "ltr" }}
              >
                Olifen
              </motion.h1>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.9, ease: [0.65, 0, 0.35, 1] }}
              className="h-px w-40 origin-right bg-gradient-to-l from-transparent via-gold to-transparent"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              className="text-sm text-muted-foreground"
            >
              الإنفوجرافيك التعليمي العربي
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
