const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // 1. إعدادات CORS للسماح بالاتصال من الموقع
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. الاتصال بـ Supabase باستخدام Service Role Key
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    try {
        // 3. التحقق من الرصيد قبل أي عملية
        const { data: user, error: fetchError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (fetchError || !user) return res.status(401).json({ reply: "Error: Invalid License Key." });
        if (user.usage_count >= user.max_limit) return res.status(403).json({ reply: "Error: Monthly Limit Reached." });

        // 4. الربط مع Groq AI (الذكاء الحقيقي)
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "You are ShieldAI, a world-class privacy and security expert. Give smart, direct, and professional answers." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        const groqData = await groqResponse.json();
        
        // التحقق من أن Groq أعطى إجابة صحيحة
        if (!groqData.choices || groqData.choices.length === 0) {
            throw new Error("AI Provider Error - Check Groq API Key");
        }

        const aiReply = groqData.choices[0].message.content;

        // 5. تحديث العداد (من 9 إلى 10 مثلاً)
        const { error: updateError } = await supabase
            .from('usage_tracking')
            .update({ usage_count: (user.usage_count || 0) + 1 })
            .eq('license_key', licenseKey);

        if (updateError) throw new Error("Database update failed");

        // 6. إرسال الإجابة النهائية
        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        console.error("Critical Error:", err.message);
        return res.status(500).json({ reply: "ShieldAI System Error: " + err.message });
    }
};
