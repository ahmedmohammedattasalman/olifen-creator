import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  subject: z.string().min(1).max(100),
  lesson: z.string().min(2).max(200),
  grade: z.string().max(50).optional(),
  style: z.string().max(50).optional(),
});

const SYSTEM = `أنت مصمم إنفوجرافيك تعليمي محترف يبدع محتوى عربياً منظماً وجاهزاً للعرض البصري.
المطلوب: حوّل الدرس إلى محتوى إنفوجرافيك منظم، يتضمن:
- عنوان رئيسي جذاب (سطر واحد)
- ٣ إلى ٥ مفاهيم أو نقاط رئيسية، لكل نقطة عنوان قصير وشرح من سطر أو سطرين
- ٣ إلى ٤ أرقام أو إحصائيات أو تواريخ مهمة (إن وُجدت)
- خلاصة من جملة واحدة
استخدم لغة عربية فصيحة وواضحة وموجزة، مناسبة للمستوى التعليمي المحدد. أعد المحتوى بصيغة Markdown نظيفة.`;

export const generateInfographic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Check user's current subscription plan details via get_user_plan RPC
    const { data: planData, error: planError } = await supabaseAdmin
      .rpc("get_user_plan", { uid: userId });

    let planName = "free";
    let generationLimit = 3;
    let isActive = true;

    if (!planError && planData && planData.length > 0) {
      planName = planData[0].plan_name;
      generationLimit = planData[0].generation_limit;
      isActive = planData[0].is_active;
    }

    // Retrieve user profile to check usage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("generation_count")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[generateInfographic] Error fetching user profile:", profileError);
    }

    const currentCount = profile?.generation_count || 0;

    if (currentCount >= generationLimit) {
      throw new Error("لقد تجاوزت الحد الأقصى للتوليد المتاح لخطتك. يرجى ترقية خطة الاشتراك الخاصة بك للاستمرار.");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Lovable AI Gateway غير مُعرّف. تأكّد من تفعيل Lovable Cloud.");
    }

    const userPrompt = `المادة: ${data.subject}
عنوان الدرس: ${data.lesson}${data.grade ? `
الصف الدراسي: ${data.grade}` : ""}
أسلوب التصميم: ${data.style ?? "educational"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (res.status === 429) throw new Error("تم تجاوز الحد المسموح. حاول بعد قليل.");
    if (res.status === 402) throw new Error("الرصيد غير كافٍ في Lovable AI. الرجاء شحن الرصيد.");
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`فشل الاتصال بنموذج الذكاء الاصطناعي: ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("لم يُرجع النموذج محتوى صالحاً.");

    // Increment user's generation count in DB
    const { error: incError } = await supabaseAdmin
      .rpc("increment_generation_count", { uid: userId });
    
    if (incError) {
      console.error("[generateInfographic] Error incrementing generation count:", incError);
    }

    return { content };
  });

