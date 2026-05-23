import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toArabic } from "@/lib/arabic-numerals";

interface Props {
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
  decimals?: number;
  prefix?: string;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function CounterStat({ value, suffix = "", label, duration = 2000, prefix = "" }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 });
  const [n, setN] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      setN(Math.floor(easeOutExpo(p) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl md:text-5xl font-black text-gradient-gold tabular-nums">
        {prefix}{toArabic(n)}{suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
