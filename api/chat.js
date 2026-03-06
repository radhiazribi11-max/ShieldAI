export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { prompt, licenseKey } = req.body;

    // التأكد من وجود المفتاح في بيئة Vercel
    const API_KEY = process.env.GEMINI_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "System Error: API Key missing in Vercel settings." });
    }

    try {
        // استخدام الرابط المباشر والأكثر استقراراً
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            // إذا استمر الرفض، سيعطينا جوجل السبب الدقيق هنا
            return res.status(500).json({ 
                error: "Google Still Rejecting", 
                reason: data.error.message,
                status: data.error.status
            });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: "ShieldAI Gateway: Connection Failed" });
    }
}
