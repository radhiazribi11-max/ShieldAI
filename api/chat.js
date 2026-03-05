export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. SaaS Licensing Logic
    if (!licenseKey || !licenseKey.startsWith('sk_live')) {
        return res.status(401).json({ error: 'Invalid or Missing Enterprise License Key' });
    }

    try {
        // 2. Secure connection to Gemini via Server-side Environment Variable
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates) throw new Error('AI Provider Error');
        
        const aiReply = data.candidates[0].content.parts[0].text;

        // 3. Secure Response
        res.status(200).json({ reply: aiReply });
    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway Timeout: Check GEMINI_KEY in Vercel settings.' });
    }
}

