import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const body = req.body;
        
        // استخراج البيانات من Gumroad
        const email = body.email;
        const licenseKey = body.license_key; 

        // إدخال البيانات في Supabase (تأكد أن الأسماء تطابق الأعمدة التي أنشأتها)
        const { error } = await supabase
            .from('usage_tracking')
            .upsert({ 
                license_key: licenseKey, 
                email: email, 
                usage_count: 0, 
                max_limit: 5000 
            }, { onConflict: 'license_key' });

        if (error) throw error;

        return res.status(200).send('ShieldAI Activated');
        
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
