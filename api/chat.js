const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { prompt, licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'License key required' });
    }

    // التحقق من الرخصة
    const { data: user, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid license' });
    }

    // التحقق من الحد
    if (user.usage_count >= user.max_limit) {
      return res.status(403).json({ error: 'Usage limit reached' });
    }

    // زيادة العداد
    await supabase
      .from('usage_tracking')
      .update({
        usage_count: (user.usage_count || 0) + 1
      })
      .eq('license_key', licenseKey);

    // الرد
    return res.status(200).json({
      reply: "ShieldAI: Message processed securely."
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};
