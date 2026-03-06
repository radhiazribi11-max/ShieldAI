export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. الدخول السريع للمدير
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    const DIRECT_KEY = "AIzaSyCUB1xypsL0-5Ty0B-BPyUPwspWFa-QmFw";
    
    // سنحاول استخدام الموديل الأكثر استقراراً أولاً لكسر العقدة
    const MODEL_NAME = "gemini-1.5-pro"; 

    try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${DIRECT_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            // رسالة تشخيصية دقيقة جداً إذا فشل
            return res.status(500).json({ 
                error: `Google Diagnostic: ${data.error.message}. Tip: Try creating a NEW API Key in Google AI Studio.` 
            });
        }

        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            res.status(200).json({ reply });
        } else {
            res.status(500).json({ error: "AI logic error: No candidates returned." });
        }

    } catch (err) {
        res.status(500).json({ error: 'Critical Connection Failure' });
    }
}
