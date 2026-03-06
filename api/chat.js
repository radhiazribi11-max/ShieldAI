export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const API_KEY = process.env.GEMINI_KEY;

    try {
        // التغيير الجذري هنا: استخدام v1beta مع موديل gemini-pro (الأكثر استقراراً)
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        // فحص الأخطاء بدقة
        if (data.error) {
            return res.status(500).json({ error: `Google API Error: ${data.error.message}` });
        }

        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply });
        } else {
            res.status(500).json({ error: "AI Response Error. Please try again." });
        }
    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway: Connection Failed' });
    }
}
