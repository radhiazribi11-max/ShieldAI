import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { prompt, licenseKey } = req.body;

    // 1. التحقق من وجود المفتاح وصلاحيته في قاعدة البيانات
    const { data: user, error: authError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

    if (authError || !user) {
        return res.status(401).json({ error: "Invalid License Key. Please purchase a plan." });
    }

    // 2. التحقق من الرصيد المتبقي
    if (user.usage_count >= user.max_limit) {
        return res.status(403).json({ error: "Limit Reached. Please upgrade your plan." });
    }

    // 3. (هنا كود مسح البيانات PII وكود الشات مع AI الذي برمجناه سابقاً)
    const reply = "This is a secure reply after checking your license..."; 

    // 4. تحديث الاستهلاك (إضافة 1 للاستخدام)
    await supabase
        .from('usage_tracking')
        .update({ usage_count: user.usage_count + 1 })
        .eq('license_key', licenseKey);

    return res.status(200).json({ 
        reply, 
        usage: { current: user.usage_count + 1, max: user.max_limit } 
    });
}
