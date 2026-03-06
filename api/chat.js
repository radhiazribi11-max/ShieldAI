const { createClient } = require('@supabase/supabase-js');

// استخدام require بدلاً من import لضمان التوافق مع Vercel Node runtime
module.exports = async (req, res) => {
  // إعدادات CORS للسماح بالطلبات
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { prompt, licenseKey } = req.body;

  try {
    // جلب البيانات من جدول usage_tracking
    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) return res.status(401).json({ error: 'Invalid License' });

    // تحديث العداد
    await supabase
      .from('usage_tracking')
      .update({ usage_count: (user.usage_count || 0) + 1 })
      .eq('license_key', licenseKey);

    return res.status(200).json({ 
      reply: `ShieldAI Secure Response: Processed your request successfully.` 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
