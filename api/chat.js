export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { prompt, licenseKey } = req.body;
    const API_KEY = process.env.GEMINI_KEY;

    // رابط مباشر وبسيط جداً بدون تعقيدات v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const aiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await aiRes.json();

        if (data.error) {
            // إذا أعطى خطأ هنا، فالمشكلة في المفتاح نفسه وليس الكود
            return res.status(500).json({ 
                error: "Google API Rejected your Key", 
                message: data.error.message 
            });
        }

        const reply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply });

    } catch (err) {
        res.status(500).json({ error: "Connection Failed" });
    }
}
