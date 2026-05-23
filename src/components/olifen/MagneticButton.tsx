import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type Variant = "primary" | "ghost" | "outline";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "ref"> {
  children: ReactNode;
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--gold)] text-background hover:bg-[var(--gold-light)] glow-gold",
  ghost:
    "bg-transparent text-foreground hover:bg-white/5 border border-border",
  outline:
    "bg-transparent text-[var(--gold)] border border-[var(--gold)]/50 hover:border-[var(--gold)]",
};

export function MagneticButton({ children, variant = "primary", className = "", ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.3 });

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-colors ${styles[variant]} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
