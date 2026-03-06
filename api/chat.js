import { scanPrompt } from "./firewall.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    if (!licenseKey || (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const scan = scanPrompt(prompt);
    const API_KEY = process.env.GEMINI_KEY;

    // قائمة الاحتمالات لعام 2026 حسب تحديثات جوجل
    const potentialModels = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    // محاولة الاتصال بالنسخ v1 و v1beta لضمان النجاح
    const apiVersions = ["v1", "v1beta"];

    for (let version of apiVersions) {
        for (let modelName of potentialModels) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: scan.clean }] }]
                    })
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0].content) {
                    const reply = data.candidates[0].content.parts[0].text;
                    // نجاح! نعيد النتيجة مع اسم الموديل الذي نجح
                    return res.status(200).json({
                        reply: reply,
                        engine: `${modelName} (${version})`,
                        securityReport: {
                            isSafe: !scan.blocked,
                            status: scan.blocked ? "🛡️ Shielded" : "✅ Clean"
                        }
                    });
                }
            } catch (e) {
                continue; // جرب الاحتمال التالي
            }
        }
    }

    return res.status(500).json({ 
        error: "All Google Models Failed", 
        detail: "Please ensure your API Key is active in Google AI Studio and has no billing issues." 
    });
}
