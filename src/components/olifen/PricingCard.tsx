import { useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { toArabic } from "@/lib/arabic-numerals";

export interface Plan {
  name: string;
  badge?: string;
  price: { monthly: number; yearly: number };
  unit: string;
  limit: string;
  features: string[];
  cta: string;
  recommended?: boolean;
}

export function PricingCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const rx = ((e.clientY - (r.top + r.height / 2)) / r.height) * -6;
    const ry = ((e.clientX - (r.left + r.width / 2)) / r.width) * 6;
    ref.current!.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = ""; };

  const price = yearly ? plan.price.yearly : plan.price.monthly;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`relative rounded-3xl p-8 transition-transform duration-300 will-change-transform ${
        plan.recommended
          ? "glass border-2 border-[var(--gold)] glow-gold md:scale-105"
          : "glass"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--gold)] text-background">
          {plan.badge}
        </div>
      )}
      <div className="text-sm text-muted-foreground mb-2">{plan.name}</div>
      <div className="flex items-baseline gap-1 mb-1">
        <motion.span
          key={price}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-black text-gradient-gold tabular-nums"
        >
          {price === 0 ? "مجاني" : `${toArabic(price)}$`}
        </motion.span>
        {price !== 0 && <span className="text-muted-foreground text-sm">{yearly ? "/سنة" : "/شهر"}</span>}
      </div>
      <div className="text-xs text-muted-foreground mb-6">{plan.limit}</div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 text-[var(--gold)] shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <MagneticButton variant={plan.recommended ? "primary" : "ghost"} className="w-full">
        {plan.cta}
      </MagneticButton>
    </div>
  );
}
