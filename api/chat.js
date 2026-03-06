const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // إعدادات CORS للسماح بالاتصال من الواجهة
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    try {
        // 1. جلب البيانات من Supabase
        const { data: user, error: fetchError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey || 'admin123')
            .single();

        if (fetchError || !user) return res.status(401).json({ reply: "Error: License check failed." });

        // 2. الاتصال بـ Groq AI
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "You are ShieldAI, a professional assistant." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const groqData = await groqResponse.json();
        
        // إذا لم يجد مفتاح Groq سيعطي رسالة واضحة
        const aiReply = groqData.choices ? groqData.choices[0].message.content : "Error: Check GROQ_API_KEY in Vercel.";

        // 3. تحديث العداد
        await supabase
            .from('usage_tracking')
            .update({ usage_count: (user.usage_count || 0) + 1 })
            .eq('license_key', licenseKey || 'admin123');

        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        return res.status(500).json({ reply: "System Error: " + err.message });
    }
};
