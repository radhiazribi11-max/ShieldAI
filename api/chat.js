const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    try {
        // 1. التحقق من الرصيد وخصم الطلب
        const { data: user } = await supabase.from('usage_tracking').select('*').eq('license_key', licenseKey).single();
        
        if (!user || user.usage_count >= user.max_limit) {
            return res.status(403).json({ reply: "Credit limit reached. Please upgrade." });
        }

        // 2. الاتصال بمحرك Groq AI للحصول على إجابة حقيقية
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768", // موديل سريع وذكي جداً
                messages: [
                    { role: "system", content: "You are ShieldAI, a secure, professional privacy assistant. Provide concise, helpful, and intelligent answers." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const groqData = await groqResponse.json();
        const aiReply = groqData.choices[0].message.content;

        // 3. تحديث العداد في قاعدة البيانات
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ reply: "Connection to AI Node failed. Please try again." });
    }
};
            
