import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    if (!prompt || !licenseKey) {
        return res.status(400).json({ error: 'Missing prompt or license key.' });
    }

    try {
        // 1. التحقق من المفتاح في Supabase (سيبحث عن admin123 أو مفاتيح Gumroad)
        const { data: user, error: authError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('license_key', licenseKey)
            .single();

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid License Key. Please purchase a plan.' });
        }

        // 2. التحقق من الرصيد
        if (user.usage_count >= user.max_limit) {
            return res.status(403).json({ error: 'Limit reached. Please upgrade.' });
        }

        // 3. تنظيف البيانات (الـ Redaction)
        const safePrompt = prompt.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]");

        // 4. تحديث الاستهلاك في الجدول
        await supabase
            .from('usage_tracking')
            .update({ usage_count: user.usage_count + 1 })
            .eq('license_key', licenseKey);

        return res.status(200).json({
            reply: `[ShieldAI] Secured message received. PII filtered. Response: Processing your request for: ${safePrompt.substring(0, 20)}...`,
            usage: { current: user.usage_count + 1, limit: user.max_limit }
        });

    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
