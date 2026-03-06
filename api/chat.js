const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // التأكد من استدعاء مكتبة الجلب

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    try {
        // 1. التحقق من الرصيد
        const { data: user } = await supabase.from('usage_tracking').select('*').eq('license_key', licenseKey).single();
        
        if (!user || user.usage_count >= user.max_limit) {
            return res.status(403).json({ reply: "Credit limit reached." });
        }

        // 2. الاتصال بـ Groq بأسلوب مستقر
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // موديل قوي وسريع جداً
                messages: [
                    { role: "system", content: "You are ShieldAI, a secure assistant. Answer the user briefly and professionally." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const groqData = await groqResponse.json();
        
        if (!groqData.choices) {
            throw new Error("Groq API Key missing or invalid in Vercel settings.");
        }

        const aiReply = groqData.choices[0].message.content;

        // 3. تحديث العداد
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        return res.status(500).json({ reply: "System Error: " + err.message });
    }
};
