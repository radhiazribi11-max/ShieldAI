import { sanitizeInput } from "./privacy.js";
import { logSecurity } from "./log.js";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { prompt, licenseKey } = req.body;
    const GROQ_KEY = process.env.GROQ_KEY;

    try {
        // 1. التحقق من المفتاح والرصيد في Supabase
        const { data: user, error } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (error || !user) return res.status(401).json({ error: "مفتاح الترخيص غير صالح" });
        if (user.usage_count >= user.max_limit) return res.status(429).json({ error: "انتهى رصيدك، يرجى الترقية" });

        // 2. تنظيف البيانات (Privacy Shield)
        const safePrompt = sanitizeInput(prompt);
        const security = logSecurity(prompt, safePrompt);

        // 3. الاتصال بـ Groq
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

        // 4. تحديث العداد في Supabase
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        return res.status(200).json({
            reply,
            usage: { current: user.usage_count + 1, max: user.max_limit },
            shielded: prompt !== safePrompt,
            security: security
        });

    } catch (err) {
        return res.status(500).json({ error: "خطأ في الاتصال بالمحرك" });
    }
}
