import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    // Gumroad يرسل الطلب بصيغة POST
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const data = req.body;

    // استخراج الإيميل والمفتاح (Gumroad يرسل license_key تلقائياً إذا فعلته)
    const email = data.email;
    const license = data.license_key || `sk_${Math.random().toString(36).substr(2, 9)}`;

    try {
        // إضافة المستخدم لـ Supabase برصيد Pro (مثلاً 5000 طلب)
        const { error } = await supabase
            .from('usage_tracking')
            .upsert({ 
                license_key: license, 
                max_limit: 5000, 
                usage_count: 0 
            });

        if (error) throw error;

        return res.status(200).send('User Activated');
    } catch (err) {
        return res.status(500).send('Webhook Error');
    }
}
  
