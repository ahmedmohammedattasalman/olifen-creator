import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Loader2, User as UserIcon, Upload, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { syncUserSubscription } from "@/lib/subscription.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "حسابي — Olifen" },
      { name: "description", content: "إدارة الملف الشخصي والمعلومات الخاصة بك في Olifen." },
    ],
  }),
});

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncSubscription = useServerFn(syncUserSubscription);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Auth check and profile loading
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          if (active) {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }
          return;
        }

        if (active) setUser(currentUser);

        // Fetch or create profile
        const { data: profile, error, status: profileStatus } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) {
          if (profileStatus === 401) {
            await supabase.auth.signOut();
            if (active) {
              toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
              navigate({ to: "/auth" });
            }
            return;
          }
          throw error;
        }

        if (profile) {
          if (active) {
            setDisplayName(profile.full_name || "");
            setAvatarUrl(profile.avatar_url);
          }
        } else {
          // If no profile row exists, create one
          const defaultName =
            currentUser.user_metadata?.display_name ||
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            "مستخدم";

          const { data: newProfile, error: insertError, status: insertStatus } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              full_name: defaultName,
              email: currentUser.email || null,
              avatar_url: currentUser.user_metadata?.avatar_url || null,
            })
            .select()
            .single();

          if (insertError) {
            if (insertStatus === 401) {
              await supabase.auth.signOut();
              if (active) {
                toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
                navigate({ to: "/auth" });
              }
              return;
            }
            throw insertError;
          }

          if (active && newProfile) {
            setDisplayName(newProfile.full_name || "");
            setAvatarUrl(newProfile.avatar_url);
          }
        }

        // Get current auth session token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        let syncedSub = null;

         if (token) {
          try {
            console.log("Syncing subscription from Polar API...");
            const syncResult = await syncSubscription({ data: { token } });
            if (syncResult && syncResult.subscription) {
              syncedSub = syncResult.subscription;
              if (active) setSubscription(syncedSub);
            }
          } catch (syncErr) {
            console.error("Failed to sync subscription via server function:", syncErr);
          }
        }

        // If not synced/found via server function, fall back to local database query
        if (!syncedSub) {
          const { data: subsData, error: subError, status: subStatus } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", currentUser.id);

          if (subError) {
            if (subStatus === 401) {
              await supabase.auth.signOut();
              if (active) {
                toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
                navigate({ to: "/auth" });
              }
              return;
            }
            console.error("Error fetching subscriptions:", subError);
          }

          if (subsData && subsData.length > 0) {
            const activeSub = subsData.find((s) => s.status === "active");
            const selectedSub = activeSub || subsData.reduce((latest, current) => {
              return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
            }, subsData[0]);

            if (active) setSubscription(selectedSub);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("حدث خطأ أثناء تحميل الملف الشخصي");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (active) navigate({ to: "/auth" });
      }
    });

    return () => {
      active = false;
      authSubscription.unsubscribe();
    };
  }, [navigate]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update auth user metadata so the navbar/session stays in sync
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName, avatar_url: avatarUrl }
      });

      if (authError) throw authError;

      toast.success("تم تحديث الملف الشخصي بنجاح!");
    } catch (err: any) {
      toast.error(err?.message || "فشل تحديث الملف الشخصي");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      setUploading(true);

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("تم رفع الصورة الشخصية بنجاح!");
    } catch (err: any) {
      toast.error(err?.message || "فشل رفع الصورة الشخصية");
    } finally {
      setUploading(false);
    }
  }

  const getPlanName = () => {
    const isCanceledButActive = subscription?.status === "canceled" && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date();
    const isActive = subscription?.status === "active";
    
    if (!subscription || (!isActive && !isCanceledButActive)) {
      return "الخطة المجانية (FREE)";
    }
    
    // Use product_name from Polar webhook if available
    if (subscription.product_name) {
      const name = subscription.product_name.toLowerCase();
      if (name.includes("pro")) return "خطة Pro";
      if (name.includes("starter") || name.includes("basic")) return "خطة Starter";
      if (name.includes("ultra")) return "خطة Ultra";
      return subscription.product_name;
    }
    
    // Fallback: check product_id
    const prodId = (subscription.product_id || "").toUpperCase();
    if (prodId === "PRO" || prodId.includes("PRO")) return "خطة Pro";
    if (prodId === "STARTER" || prodId.includes("STARTER") || prodId.includes("INFOGRAPHIC") || prodId.includes("BASIC")) return "خطة Starter";
    if (prodId === "ULTRA" || prodId.includes("ULTRA")) return "خطة Ultra";
    return "الخطة المدفوعة (Premium)";
  };

  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background relative overflow-hidden py-16 px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--gold)_15%,transparent),transparent_60%)]" />

      <div className="mx-auto max-w-xl relative z-10">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] grid place-items-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-xl font-black" style={{ direction: "ltr" }}>
              <span className="text-gradient-gold">Olifen</span>
            </span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            العودة للرئيسية <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-2xl space-y-6"
        >
          <div className="text-center">
            <h1 className="font-display text-2xl font-black mb-1">حسابي الشخصي</h1>
            <p className="text-sm text-muted-foreground">إدارة معلوماتك وصورتك الشخصية.</p>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border shadow-md">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-gradient-to-br from-[var(--gold)] to-[var(--violet)] text-background text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--gold)]" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-white" />
                    <span className="text-[10px] text-white font-medium">تغيير الصورة</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            {uploading && <span className="text-xs text-muted-foreground">جاري رفع الصورة...</span>}
          </div>

          {/* Subscription Section */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--gold)] animate-pulse" />
                <span className="text-sm font-bold text-foreground">الاشتراك الحالي</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gold/10 text-[var(--gold)] border border-gold/20">
                {getPlanName()}
              </span>
            </div>

            {subscription && (subscription.status === "active" || (subscription.status === "canceled" && subscription.current_period_end && new Date(subscription.current_period_end) > new Date())) ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>تاريخ انتهاء الفترة:</span>
                  <span dir="ltr">
                    {new Date(subscription.current_period_end).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {subscription.cancel_at_period_end && (
                  <p className="text-[var(--gold)] text-[10px] font-medium">
                    تم إلغاء التجديد التلقائي. سينتهي الاشتراك في التاريخ المحدد أعلاه.
                  </p>
                )}
                <a 
                  href="https://polar.sh/purchases" 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-2 block text-center rounded-lg border border-border/80 hover:bg-accent/20 py-2 font-bold text-foreground transition-colors"
                >
                  إدارة الاشتراك عبر Polar
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  أنت مشترك حالياً في الخطة المجانية. قم بالترقية للوصول إلى مميزات توليد لا نهائية وتصدير بجودة عالية.
                </p>
                <Link 
                  to="/" 
                  hash="pricing"
                  className="block text-center rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-light)] text-background py-2 text-xs font-bold transition-colors"
                >
                  ترقية الاشتراك الآن
                </Link>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                dir="ltr"
                className="w-full rounded-lg border border-border bg-background/30 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              />
              <span className="text-xs text-muted-foreground mt-1 block">لا يمكن تغيير البريد الإلكتروني.</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">الاسم المستعار</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="أدخل اسمك المستعار"
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-light)] text-background px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ التعديلات
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
