import { scanPrompt } from "./firewall.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { prompt, licenseKey } = req.body;

    if (!licenseKey || (licenseKey !== 'admin123' && !licenseKey.startsWith('sk_'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const scan = scanPrompt(prompt);
    const API_KEY = process.env.GEMINI_KEY;

    try {
        // التغيير هنا: v1 بدلاً من v1beta و حذف -latest
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: scan.clean }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // إذا فشل هذا أيضاً، سنقوم بتبديل الموديل برمجياً في المحاولة القادمة
            return res.status(500).json({ 
                error: `Google API Error: ${data.error.message}`,
                suggestion: "Try changing model name in the code to 'gemini-pro' if this persists."
            });
        }

        let aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI returned empty response";

        return res.status(200).json({
            reply: aiReply,
            securityReport: {
                isSafe: !scan.blocked,
                blockedCount: scan.piiCount,
                status: scan.blocked ? "🛡️ Shielded" : "✅ Clean"
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Gateway Error", details: err.message });
    }
}
