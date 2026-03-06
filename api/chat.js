const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

module.exports = async (req, res) => {

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

    const { prompt, licenseKey } = req.body;

    if (!prompt || !licenseKey) {
      return res.status(400).json({ error: "Missing prompt or licenseKey" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // 1️⃣ جلب المستخدم
    const { data: user, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: "Invalid license key" });
    }

    if (user.usage_count >= user.max_limit) {
      return res.status(403).json({ error: "Credits exhausted" });
    }

    // 2️⃣ تنظيف البيانات الحساسة
    let cleanPrompt = prompt
      .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]')
      .replace(/\+?\d{8,15}/g, '[PHONE]');

    // 3️⃣ طلب Groq
    const ai = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are ShieldAI secure assistant."
          },
          {
            role: "user",
            content: cleanPrompt
          }
        ]
      })
    });

    const aiData = await ai.json();

    if (!aiData.choices) {
      return res.status(500).json({ error: "AI response error" });
    }

    const reply = aiData.choices[0].message.content;

    // 4️⃣ تحديث الاستهلاك
    const newUsage = user.usage_count + 1;

    await supabase
      .from('usage_tracking')
      .update({ usage_count: newUsage })
      .eq('license_key', licenseKey);

    // 5️⃣ الرد
    return res.status(200).json({
      reply: reply,
      usage: {
        current: newUsage,
        max: user.max_limit
      }
    });

  } catch (err) {

    console.error("ShieldAI Error:", err);

    return res.status(500).json({
      error: "Server error"
    });

  }

};
