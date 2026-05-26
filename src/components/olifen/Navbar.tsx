import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Sparkles, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const links = [
  { href: "#features", label: "المميزات" },
  { href: "#demo", label: "جرّب الآن" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#faq", label: "أسئلة شائعة" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 60));

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "U";

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    if (window.location.pathname !== "/") return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
              <a
                href={l.href === "/" ? "/" : `/${l.href}`}
                onClick={(e) => handleAnchorClick(e, l.href)}
                className="hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-background/50 backdrop-blur px-2 py-1 hover:bg-background/80 transition-colors">
                  <Avatar className="h-8 w-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] text-background text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="font-bold truncate">{displayName}</span>
                  <span className="text-xs text-muted-foreground truncate font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/generate" })}>
                  <LayoutDashboard className="ms-2 h-4 w-4" />
                  لوحة التحكم
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/generate" })}>
                  <UserIcon className="ms-2 h-4 w-4" />
                  حسابي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="ms-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-full text-sm font-bold bg-[var(--gold)] text-background hover:bg-[var(--gold-light)] transition-colors"
            >
              ابدأ مجاناً
            </Link>
          )}
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
                  <a
                    onClick={(e) => { setOpen(false); handleAnchorClick(e, l.href); }}
                    href={l.href}
                    className="block py-2 text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              {user ? (
                <>
                  <li className="flex items-center gap-3 pt-2 border-t border-border">
                    <Avatar className="h-9 w-9">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                      <AvatarFallback className="bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] text-background text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{displayName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </li>
                  <li>
                    <Link
                      to="/generate"
                      onClick={() => setOpen(false)}
                      className="block text-center px-4 py-3 rounded-full font-bold border border-border"
                    >
                      لوحة التحكم
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="w-full text-center px-4 py-3 rounded-full font-bold bg-destructive/10 text-destructive"
                    >
                      تسجيل الخروج
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="block text-center mt-2 px-4 py-3 rounded-full font-bold bg-[var(--gold)] text-background"
                  >
                    ابدأ مجاناً
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
