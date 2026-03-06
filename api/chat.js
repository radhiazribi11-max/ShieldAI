import { scanPrompt } from "./firewall.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    // التحقق من الرخصة (Admin أو عميل دفع في جمرود)
    if (!licenseKey || (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_'))) {
        return res.status(401).json({ error: 'Unauthorized: Valid License Required' });
    }

    // تشغيل محرك الحماية (Firewall)
    const scan = scanPrompt(prompt);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: scan.clean }] }]
            })
        });

        const data = await response.json();
        
        // الرد الاحترافي الذي يوضح قيمة الحماية
        return res.status(200).json({
            reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI Silence",
            securityReport: {
                isSafe: !scan.blocked,
                blockedCount: scan.piiCount,
                typesFound: scan.detectedTypes,
                status: scan.blocked ? "🛡️ Shielded" : "✅ Clean"
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Gateway Error" });
    }
}
