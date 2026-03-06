const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { licenseKey, prompt } = req.body;

    if (!licenseKey) return res.status(400).json({ error: "License key missing" });

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("license_key", licenseKey)
      .single();

    if (error || !data) return res.status(401).json({ error: "Invalid license" });

    // تحديث العداد
    await supabase
      .from("usage_tracking")
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq("license_key", licenseKey);

    return res.status(200).json({ reply: "ShieldAI: OK" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
      
