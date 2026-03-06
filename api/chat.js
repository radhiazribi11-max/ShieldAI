export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. الدخول (المدير أو العميل)
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    // المفتاح المباشر الخاص بك
    const DIRECT_KEY = "AIzaSyCUB1xypsL0-5Ty0B-BPyUPwspWFa-QmFw";

    try {
        // استخدام gemini-1.5-flash-latest لضمان التوافق مع v1beta
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${DIRECT_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await aiRes.json();

        // فحص الأخطاء الواردة من Google
        if (data.error) {
            return res.status(500).json({ 
                error: `Google API Error: ${data.error.message}` 
            });
        }

        // استخراج الرد
        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply });
        } else {
            res.status(500).json({ error: "No response from AI. Check your safety settings or prompt." });
        }

    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway: Connection Failed' });
    }
}
