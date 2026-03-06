import { sanitizeInput } from "./privacy.js";
import { logSecurity } from "./log.js";
import { createClient } from '@supabase/supabase-js';

// تهيئة اتصال Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { prompt, licenseKey } = req.body;
    const GROQ_KEY = process.env.GROQ_KEY;

    // 1. التحقق من العداد في Supabase
    const { data: user, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: "Invalid License Key" });
    }

    // 2. التحقق من تجاوز الحد
    if (user.usage_count >= user.max_limit) {
        return res.status(429).json({ 
            error: "Too Many Requests", 
            message: "لقد تجاوزت حدك الشهري. يرجى الترقية للخطة الاحترافية." 
        });
    }

    // 3. تنظيف النص (Privacy Shield)
    const safePrompt = sanitizeInput(prompt);

    try {
        // 4. طلب الـ AI من Groq
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: safePrompt }]
            })
        });

        const aiData = await aiRes.json();
        const reply = aiData.choices[0].message.content;

        // 5. تحديث العداد في Supabase بعد نجاح العملية
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1, last_used: new Date() })
            .eq('license_key', licenseKey);

        return res.status(200).json({
            reply,
            usage: { current: user.usage_count + 1, max: user.max_limit },
            security: logSecurity(prompt, safePrompt)
        });

    } catch (err) {
        res.status(500).json({ error: "Service Unavailable" });
    }
}
