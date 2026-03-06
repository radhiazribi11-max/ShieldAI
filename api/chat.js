export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. الدخول (المدير أو العميل)
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    const DIRECT_KEY = "AIzaSyCUB1xypsL0-5Ty0B-BPyUPwspWFa-QmFw";

    try {
        // تم تحديث الرابط هنا ليتوافق مع الإصدار v1 المستقر (Stable)
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${DIRECT_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            // إذا استمر الخطأ في v1 سنحاول v1beta مع موديل gemini-pro
            return res.status(500).json({ error: `Google API Error: ${data.error.message}` });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: 'ShieldAI Gateway: Connection Failed' });
    }
}
