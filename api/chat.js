import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, licenseKey } = req.body;

    const { data: user, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (fetchError || !user) return res.status(401).json({ error: 'Invalid License' });
    if (user.usage_count >= user.max_limit) return res.status(403).json({ error: 'Limit reached' });

    const secureReply = `ShieldAI verified: Your message was processed securely.`;

    await supabase
      .from('usage_tracking')
      .update({ usage_count: user.usage_count + 1 })
      .eq('license_key', licenseKey);

    return res.status(200).json({ reply: secureReply });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Error' });
  }
}
