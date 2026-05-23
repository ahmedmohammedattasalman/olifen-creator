import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  subject: z.string().min(1).max(100),
  lesson: z.string().min(2).max(200),
  grade: z.string().min(1).max(50),
  style: z.string().max(50).optional(),
});

const SYSTEM = `أنت مصمم إنفوجرافيك تعليمي محترف يبدع محتوى عربياً منظماً وجاهزاً للعرض البصري.
المطلوب: حوّل الدرس إلى محتوى إنفوجرافيك منظم، يتضمن:
- عنوان رئيسي جذاب (سطر واحد)
- ٣ إلى ٥ مفاهيم أو نقاط رئيسية، لكل نقطة عنوان قصير وشرح من سطر أو سطرين
- ٣ إلى ٤ أرقام أو إحصائيات أو تواريخ مهمة (إن وُجدت)
- خلاصة من جملة واحدة
استخدم لغة عربية فصيحة وواضحة وموجزة، مناسبة للصف الدراسي المحدد. أعد المحتوى بصيغة Markdown نظيفة.`;

export const generateInfographic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Lovable AI Gateway غير مُعرّف. تأكّد من تفعيل Lovable Cloud.");
    }

    const userPrompt = `المادة: ${data.subject}
عنوان الدرس: ${data.lesson}
الصف الدراسي: ${data.grade}
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

    return { content };
  });
