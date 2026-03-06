import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {

    const body = req.body;

    // بيانات Gumroad
    const email = body.email;
    const licenseKey = body.license_key || body.purchase?.license_key;

    if (!licenseKey) {
      return res.status(400).json({ error: "License key missing" });
    }

    // حفظ المستخدم
    const { error } = await supabase
      .from('usage_tracking')
      .upsert({
        license_key: licenseKey,
        email: email,
        usage_count: 0,
        max_limit: 5000
      }, { onConflict: 'license_key' });

    if (error) throw error;

    console.log("New license activated:", licenseKey);

    return res.status(200).send("ShieldAI Activated");

  } catch (err) {

    console.error("Webhook Error:", err.message);

    return res.status(500).json({
      error: err.message
    });

  }

}
