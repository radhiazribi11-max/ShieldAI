import { createClient } from '@supabase/supabase-js';

// استدعاء القيم من Environment Variables التي وضعتها في Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const body = req.body;
        
        // البيانات القادمة من Gumroad
        const email = body.email;
        const licenseKey = body.license_key; 
        
        // تحديد الصلاحيات (Pro Plan = 5000 طلب)
        const maxLimit = 5000;

        // إدخال البيانات في الجدول (تأكد أن اسم الجدول usage_tracking موجود)
        const { error } = await supabase
            .from('usage_tracking') 
            .upsert({ 
                license_key: licenseKey, 
                email: email, // أضفنا الإيميل لسهولة البحث لاحقاً
                max_limit: maxLimit, 
                usage_count: 0 
            }, { onConflict: 'license_key' }); // لتحديث البيانات إذا اشترى العميل مرة أخرى بنفس المفتاح

        if (error) throw error;

        return res.status(200).send('ShieldAI Activation Success');
        
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
