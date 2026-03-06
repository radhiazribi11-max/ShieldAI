export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    // الدخول للمدير
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    const API_KEY = process.env.GEMINI_KEY;

    try {
        // الرابط الصحيح والمؤكد لعام 2026 لموديلات Flash
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            // إذا أعطى خطأ، سنعرضه لك بدقة لنعرف "الكلمة" التي يريدها جوجل
            return res.status(500).json({ error: `ShieldAI Debug: ${data.error.message}` });
        }

        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply });
        } else {
            res.status(500).json({ error: "AI logic mismatch. Please check API Key status." });
        }
    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway: Connection Failed' });
    }
}
