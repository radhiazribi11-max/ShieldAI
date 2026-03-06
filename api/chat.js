export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    if (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_')) {
        return res.status(401).json({ error: 'Unauthorized Access' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Environment Key Missing" });

    // قائمة المسميات المحتملة للموديل حسب تحديثات جوجل الأخيرة
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro"
    ];

    for (let model of models) {
        try {
            const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await aiRes.json();

            // إذا نجح الموديل، أرسل الرد فوراً
            if (data.candidates && data.candidates.length > 0) {
                return res.status(200).json({ 
                    reply: data.candidates[0].content.parts[0].text,
                    engine: model 
                });
            }
            
            // إذا كان الخطأ متعلقاً بالموديل فقط، استمر في الحلقة لتجربة الموديل التالي
            console.log(`Model ${model} failed, trying next...`);
        } catch (err) {
            continue; 
        }
    }

    res.status(500).json({ error: "All AI Engines failed. Please check if your API Key is active in Google AI Studio." });
}
