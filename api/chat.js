import { sanitizeInput } from "./privacy.js";
import { logSecurity } from "./log.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, licenseKey } = req.body;

    // 1. التحقق من الصلاحية (Admin أو مفتاح عميل)
    if (!licenseKey || (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_'))) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    // 2. تفعيل درع الخصوصية (Privacy Shield)
    const safePrompt = sanitizeInput(prompt);

    // 3. تسجيل محاولة الاختراق أو تسريب البيانات
    const securityLog = logSecurity(prompt, safePrompt);

    const GROQ_KEY = process.env.GROQ_KEY;
    if (!GROQ_KEY) {
        return res.status(500).json({ error: "Server Error: Groq Key Missing" });
    }

    try {
        // 4. إرسال الطلب "النظيف" إلى Groq Cloud
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // أسرع موديل متاح في 2026
                messages: [
                    { role: "system", content: "You are ShieldAI, a secure AI proxy. Always be professional." },
                    { role: "user", content: safePrompt }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: "AI Engine Error", details: data.error.message });
        }

        const reply = data.choices[0].message.content;

        // 5. الرد النهائي مع بيانات الأمان للواجهة
        return res.status(200).json({
            reply,
            security: securityLog,
            shielded: prompt !== safePrompt
        });

    } catch (err) {
        return res.status(500).json({ error: "ShieldAI Gateway Failure" });
    }
}
