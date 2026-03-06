export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;
    
    // تأكد من جلب المفتاح بشكل صحيح من البيئة
    const API_KEY = process.env.GEMINI_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "System Error: Variable GEMINI_KEY is missing in Vercel environment." });
    }

    // السماح لك بالدخول
    if (licenseKey !== 'admin123' && licenseKey !== 'ofuefu') {
         // التحقق من جمرود (اختياري للتجربة الآن)
    }

    try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            return res.status(500).json({ error: `Google API Error: ${data.error.message}` });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: 'Gateway Connection Failed' });
    }
}
