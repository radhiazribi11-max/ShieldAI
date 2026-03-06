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
        // تحديث الرابط إلى النسخة v1beta مع الموديل الصحيح gemini-1.5-flash
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${DIRECT_KEY}`, {
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

        // فحص وجود أخطاء من Google
        if (data.error) {
            return res.status(500).json({ 
                error: `Google API Error (${data.error.code}): ${data.error.message}` 
            });
        }

        // التأكد من وجود رد
        if (!data.candidates || data.candidates.length === 0) {
            return res.status(500).json({ error: "AI Response is empty. Try a different prompt." });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway: Connection Failed to Google Servers' });
    }
}
