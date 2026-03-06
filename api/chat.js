export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    if (!licenseKey) {
        return res.status(401).json({ error: 'License Key Required' });
    }

    try {
        // 1. Verify License with Gumroad API
        const gumroadRes = await fetch(`https://api.gumroad.com/v2/licenses/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                product_permalink: 'ofuefu', // Your product ID from radhiayt.gumroad.com/l/ofuefu
                license_key: licenseKey
            })
        });
        
        const gumData = await gumroadRes.json();

        // Check if the license is valid and not over-used
        if (!gumData.success || gumData.uses > 50) {
            return res.status(401).json({ error: 'Invalid or Expired Enterprise License' });
        }

        // 2. Call Gemini AI via Server-side Key (GEMINI_KEY must be in Vercel Settings)
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();
        const reply = data.candidates[0].content.parts[0].text;

        res.status(200).json({ 
            reply, 
            customer: gumData.purchase.email 
        });

    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway Error: Check GEMINI_KEY in Vercel' });
    }
}
