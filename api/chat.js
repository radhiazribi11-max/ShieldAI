const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // 1. إعدادات الوصول (CORS) لضمان عدم حظر الطلب من المتصفح
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(200).json({ status: "ShieldAI API Online" });

    // 2. الاتصال بـ Supabase (تأكد من وضع Service Role Key في Vercel Env)
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    try {
        // 3. جلب بيانات المستخدم والتحقق من الرصيد
        const { data: user, error: fetchError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (fetchError || !user) return res.status(401).json({ error: "License Unauthorized" });
        if (user.usage_count >= user.max_limit) return res.status(403).json({ error: "Credit Limit Exceeded" });

        // 4. توليد إجابة ذكية (AI Processing)
        // ملاحظة: يمكنك هنا ربط OpenAI أو Groq، حالياً سنولد ردًا ذكيًا يحاكي النظام
        const responses = [
            `I have analyzed your request: "${prompt}". My security protocols confirm this is safe to process.`,
            `ShieldAI Intelligence: Regarding "${prompt}", I recommend implementing end-to-end encryption for this specific data flow.`,
            `Verification Complete. Your query "${prompt}" has been scrubbed of sensitive PII and processed via our secure node.`
        ];
        const aiReply = responses[Math.floor(Math.random() * responses.length)];

        // 5. التحديث الفعلي للعداد في قاعدة البيانات
        const { error: updateError } = await supabase
            .from('usage_tracking')
            .update({ usage_count: (user.usage_count || 0) + 1 })
            .eq('license_key', licenseKey);

        if (updateError) throw new Error("Failed to update credits");

        // 6. إرسال الرد النهائي للداشبورد
        return res.status(200).json({ reply: aiReply });

    } catch (err) {
        console.error("API Error:", err.message);
        return res.status(500).json({ error: "Internal Secure Server Error" });
    }
};
