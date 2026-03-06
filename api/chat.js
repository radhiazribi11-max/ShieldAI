const { createClient } = require('@supabase/supabase-js');

// الاتصال بـ Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
    // إعدادات CORS
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
        // 1. التحقق من الرخصة والرصيد
        const { data: user, error: authError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid License Key.' });
        }

        if (user.usage_count >= user.max_limit) {
            return res.status(403).json({ error: 'Limit Reached. Please upgrade.' });
        }

        // 2. محرك تنظيف البيانات (PII Redaction)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        
        const safePrompt = prompt
            .replace(emailRegex, "[HIDDEN_EMAIL]")
            .replace(phoneRegex, "[HIDDEN_PHONE]");

        // 3. الرد الذكي (يمكنك لاحقاً استبداله بـ Groq بوضع API Key)
        let aiResponse = `[ShieldAI Secure] Analysis for "${safePrompt.substring(0, 20)}...": No data leaks detected. System is safe.`;

        // 4. تحديث العداد في قاعدة البيانات
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        // 5. إرسال الرد النهائي للداشبورد
        return res.status(200).json({ reply: aiResponse });

    } catch (err) {
        return res.status(500).json({ error: 'Gateway Error: ' + err.message });
    }
};
