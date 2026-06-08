import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Olifen" },
      { name: "description", content: "سجل الدخول أو أنشئ حساباً جديداً في Olifen." },
    ],
  }),
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already signed in, unless in recovery mode
  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery") || 
                       window.location.search.includes("type=recovery");

    if (isRecovery) {
      setMode("reset");
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !isRecovery) {
        navigate({ to: "/" });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event as any) === "PASSWORD_RECOVERY") {
        setMode("reset");
      } else if (session) {
        const isCurrentRecovery = window.location.hash.includes("type=recovery") || 
                                 window.location.search.includes("type=recovery") ||
                                 (event as any) === "PASSWORD_RECOVERY";
        if (!isCurrentRecovery) {
          navigate({ to: "/" });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?type=recovery`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! تحقق من بريدك لتأكيد التسجيل.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بك مجدداً!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
        setMode("signin");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("تم تحديث كلمة المرور بنجاح! تم تسجيل دخولك.");
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen grid place-items-center bg-background px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--gold)_20%,transparent),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] grid place-items-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-display text-2xl font-black" style={{ direction: "ltr" }}>
            <span className="text-gradient-gold">Olifen</span>
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-center">
          {mode === "signin" && "تسجيل الدخول"}
          {mode === "signup" && "إنشاء حساب جديد"}
          {mode === "forgot" && "استعادة كلمة المرور"}
          {mode === "reset" && "تعيين كلمة المرور الجديدة"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2">
          {mode === "signin" && "أهلاً بعودتك إلى Olifen"}
          {mode === "signup" && "ابدأ رحلتك مع Olifen مجاناً"}
          {mode === "forgot" && "أدخل بريدك الإلكتروني لإرسال رابط الاستعادة"}
          {mode === "reset" && "أدخل كلمة المرور الجديدة لحسابك"}
        </p>

        {/* Google */}
        {(mode === "signin" || mode === "signup") && (
          <>
            <button
              type="button"
              onClick={onGoogle}
              disabled={googleLoading || loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-background/50 hover:bg-accent/20 px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
                </svg>
              )}
              متابعة باستخدام Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">أو</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-3 mt-6">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكامل"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
          )}
          {mode !== "reset" && (
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
          )}
          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">
                  {mode === "reset" ? "كلمة المرور الجديدة" : "كلمة المرور"}
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-[var(--gold)] hover:underline"
                  >
                    هل نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-light)] text-background px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" && "تسجيل الدخول"}
            {mode === "signup" && "إنشاء الحساب"}
            {mode === "forgot" && "إرسال رابط استعادة كلمة المرور"}
            {mode === "reset" && "تحديث كلمة المرور"}
          </button>
        </form>

        {mode !== "reset" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[var(--gold)] hover:underline font-semibold"
                >
                  أنشئ حساباً
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-[var(--gold)] hover:underline font-semibold"
                >
                  سجّل الدخول
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-[var(--gold)] hover:underline font-semibold"
              >
                العودة لتسجيل الدخول
              </button>
            )}
          </p>
        )}
      </motion.div>
    </div>
  );
}
