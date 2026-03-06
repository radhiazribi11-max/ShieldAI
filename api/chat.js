export default async function handler(req, res) {
    // التأكد من نوع الطلب
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. التحقق من الهوية (Admin/User)
    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Access Denied: Invalid Key' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Server Configuration Error: GEMINI_KEY is missing." });

    try {
        // استخدام الموديل الأكثر ضماناً حالياً مع الرابط المستقر v1
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // في حال وجود خطأ من جوجل
        if (data.error) {
            return res.status(500).json({ error: `Google API Error: ${data.error.message}` });
        }

        // إرسال الرد بنجاح
        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else {
            return res.status(500).json({ error: "AI returned an empty response. Try again." });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Gateway Connection Timeout. Please Refresh." });
    }
}
