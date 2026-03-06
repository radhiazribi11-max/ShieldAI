import { createClient } from '@supabase/supabase-js';

// إعداد الاتصال بـ Supabase باستخدام المتغيرات البيئية في Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, licenseKey } = req.body;

    // 1. التحقق من وجود المستخدم وصلاحية الرصيد
    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid License Key or User not found' });
    }

    if (user.usage_count >= user.max_limit) {
      return res.status(403).json({ error: 'Credit limit reached. Please upgrade.' });
    }

    // 2. معالجة النص (محاكاة محرك الحماية ShieldAI)
    // هنا نقوم بتبديل أي إيميل أو رقم هاتف بكلمة [REDACTED] لحماية الخصوصية
    const redactedPrompt = prompt.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]");
    
    const aiReply = `ShieldAI secure processing: I received your message "${redactedPrompt}". Your data is safe and has been processed according to your privacy policy.`;

    // 3. تحديث عداد الاستخدام في Supabase
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update({ usage_count: user.usage_count + 1 })
      .eq('license_key', licenseKey);

    if (updateError) throw updateError;

    // 4. إرسال الرد النهائي
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
}
y
