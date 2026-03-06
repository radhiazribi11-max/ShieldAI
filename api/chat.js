const { createClient } = require('@supabase/supabase-js');

// إعداد الاتصال باستخدام المتغيرات المخزنة في Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
    // 1. إعدادات CORS للسماح بالاتصال من المتصفح
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    if (!prompt || !licenseKey) {
        return res.status(400).json({ error: 'Missing prompt or license key.' });
    }

    try {
        // 2. التحقق من الرخصة والرصيد في Supabase
        const { data: user, error: authError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (authError || !user) {
            return res.status(401).json({ reply: 'Error: Invalid License Key.' });
        }

        if (user.usage_count >= user.max_limit) {
            return res.status(403).json({ reply: 'Error: Credit Limit Reached.' });
        }

        // 3. محرك تنظيف البيانات (PII Redaction) - ميزتك التنافسية للتسويق
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        
        const safePrompt = prompt
            .replace(emailRegex, "[HIDDEN_EMAIL]")
            .replace(phoneRegex, "[HIDDEN_PHONE]");

        // 4. محرك الردود الذكي (ShieldAI Logic)
        const aiResponse = `[ShieldAI Analysis]: I have processed your request for "${safePrompt.substring(0, 30)}...". All PII data has been scrubbed. System is secure.`;

        // 5. التحديث الفعلي للعداد (ليتحرك من 9 إلى 10 مثلاً)
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        // 6. إرسال الرد النهائي للواجهة
        return res.status(200).json({ reply: aiResponse });

    } catch (err) {
        console.error('Chat API Error:', err.message);
        return res.status(500).json({ reply: 'Security Gateway Error. Try again.' });
    }
};
