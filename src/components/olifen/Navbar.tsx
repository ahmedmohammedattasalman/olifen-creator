import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";

const links = [
  { href: "#features", label: "المميزات" },
  { href: "#demo", label: "جرّب الآن" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#faq", label: "أسئلة شائعة" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 60));

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between" dir="rtl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] grid place-items-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-display text-xl font-black tracking-tight" style={{ direction: "ltr" }}>
            <span className="text-gradient-gold">Olifen</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className="px-4 py-2 rounded-full text-sm font-bold bg-[var(--gold)] text-background hover:bg-[var(--gold-light)] transition-colors"
          >
            ابدأ مجاناً
          </Link>
        </div>

        <button
          aria-label="القائمة"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden h-10 w-10 grid place-items-center rounded-md border border-border"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl"
          >
            <ul className="px-6 py-4 space-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <a onClick={() => setOpen(false)} href={l.href} className="block py-2 text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block text-center mt-2 px-4 py-3 rounded-full font-bold bg-[var(--gold)] text-background"
                >
                  ابدأ مجاناً
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
