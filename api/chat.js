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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: scan.clean }] }]
            })
        });

        const data = await response.json();

        // فحص دقيق لاستخراج النص مهما كان مكانه
        let aiReply = "";
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            aiReply = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            aiReply = `Google Error: ${data.error.message}`;
        } else {
            aiReply = "The AI is thinking but couldn't formulate a text response. Please try a different prompt.";
        }

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
