export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { prompt, licenseKey } = req.body;
    const API_KEY = process.env.GEMINI_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // سيعطيك جوجل هنا الرمز الدقيق للخطأ (مثل 403 أو 429)
            return res.status(data.error.code || 500).json({ 
                error: "ShieldAI Engine Error", 
                message: data.error.message,
                status: data.error.status 
            });
        }

        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply });

    } catch (err) {
        return res.status(500).json({ error: "Critical Gateway Failure" });
    }
}
