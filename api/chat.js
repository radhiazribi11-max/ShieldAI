const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { prompt, licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(401).json({ error: "License missing" });
    }

    const { data: user, error } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("license_key", licenseKey)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid license" });
    }

    if (user.usage_count >= user.max_limit) {
      return res.status(403).json({ error: "Usage limit reached" });
    }

    await supabase
      .from("usage_tracking")
      .update({ usage_count: user.usage_count + 1 })
      .eq("license_key", licenseKey);

    return res.status(200).json({
      reply: "ShieldAI Secure Response: Request processed successfully"
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }
};
