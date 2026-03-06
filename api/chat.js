export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, licenseKey } = req.body;

    // 1. نظام التحقق المزدوج (العملاء + المدير)
    let isValid = false;

    if (licenseKey === 'admin123') {
        isValid = true; // السماح لك بالتجربة كمدير
    } else {
        try {
            const gumroadRes = await fetch(`https://api.gumroad.com/v2/licenses/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    product_permalink: 'ofuefu', 
                    license_key: licenseKey
                })
            });
            const gumData = await gumroadRes.json();
            if (gumData.success) isValid = true;
        } catch (err) {
            console.error("Gumroad Error");
        }
    }

    if (!isValid) {
        return res.status(401).json({ error: 'Invalid or Expired Enterprise License' });
    }

    // 2. الاتصال بـ Gemini (تأكد أن GEMINI_KEY موجود في Vercel)
    try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();
        
        if (data.error) {
            return res.status(500).json({ error: 'AI Key Error: Please check your GEMINI_KEY in Vercel settings.' });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: 'Gateway Error' });
    }
}
