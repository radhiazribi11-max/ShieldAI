export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. الدخول باستخدام الباسورد الخاص بك أو مفتاح جمرود
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized: Invalid License Key' });
    }

    // 2. المفتاح المباشر (لحل مشكلة Vercel فوراً)
    const DIRECT_KEY = "AIzaSyCUB1xypsL0-5Ty0B-BPyUPwspWFa-QmFw";

    try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${DIRECT_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        // فحص رد جوجل
        if (data.error) {
            return res.status(500).json({ error: `Google Error: ${data.error.message}` });
        }

        if (!data.candidates || data.candidates.length === 0) {
            return res.status(500).json({ error: "AI Response Empty" });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: 'Gateway Connection Failed' });
    }
}
