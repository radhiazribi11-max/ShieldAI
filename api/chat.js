// كود السيرفر api/chat.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    // 1. تحديث العداد في قاعدة البيانات أولاً
    const { data: user } = await supabase.from('usage_tracking').select('*').eq('license_key', licenseKey).single();
    await supabase.from('usage_tracking').update({ usage_count: user.usage_count + 1 }).eq('license_key', licenseKey);

    // 2. هنا نضع الربط مع محرك الذكاء الاصطناعي
    // للحصول على إجابة عادية وذكية، يمكنك استخدام fetch لـ OpenAI أو Groq
    const aiResponse = `This is a live intelligent response to your query: "${prompt}". Your privacy is our priority.`;

    return res.status(200).json({ reply: aiResponse });
};
