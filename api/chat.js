const { createClient } = require('@supabase/supabase-js');

// تعريف واحد فقط للعميل خارج الدالة لضمان السرعة
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  // إعدادات CORS الموحدة
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // معالجة طلب الـ Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // قبول طلبات POST فقط
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, licenseKey } = req.body;

  try {
    // 1. جلب بيانات الرخصة
    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) return res.status(401).json({ error: 'Invalid License' });
    if (user.usage_count >= user.max_limit) return res.status(403).json({ error: 'Limit reached' });

    // 2. تحديث العداد (زيادة الاستهلاك بـ 1)
    await supabase
      .from('usage_tracking')
      .update({ usage_count: (user.usage_count || 0) + 1 })
      .eq('license_key', licenseKey);

    // 3. الرد النهائي (الذي كان يظهر في صورتك الناجحة)
    return res.status(200).json({ 
      reply: `ShieldAI Secure Response: Processed your request successfully.` 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
