const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // تفعيل الوصول من أي مكان (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'API is online' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { prompt, licenseKey } = req.body;

    // جلب بيانات الرخصة
    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) return res.status(401).json({ error: 'License error' });

    // تحديث العداد في Supabase
    await supabase
      .from('usage_tracking')
      .update({ usage_count: (user.usage_count || 0) + 1 })
      .eq('license_key', licenseKey);

    return res.status(200).json({ reply: "ShieldAI: Message processed securely." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
