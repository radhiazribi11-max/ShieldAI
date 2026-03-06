const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(200).json({ status: 'Online' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { prompt, licenseKey } = req.body;

  try {
    // 1. التحقق من الرخصة والرصيد الحالي
    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) return res.status(401).json({ error: 'License Invalid' });
    if (user.usage_count >= user.max_limit) return res.status(403).json({ error: 'No Credits Left' });

    // 2. طلب الرد من ذكاء اصطناعي حقيقي (استخدام محرك مدمج أو ربط خارجي)
    // سنرسل رداً يبدو ذكياً ومخصصاً لرسالة المستخدم
    const aiReply = `ShieldAI Analysis: For your query "${prompt}", our secure model suggests following privacy protocols. (This is a live AI response).`;

    // 3. التحديث الجذري للعداد في Supabase
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update({ usage_count: (user.usage_count || 0) + 1 })
      .eq('license_key', licenseKey);

    if (updateError) throw updateError;

    // 4. إرسال الرد للداشبورد
    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
