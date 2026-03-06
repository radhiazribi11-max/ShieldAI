export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { prompt, licenseKey } = req.body;
    const GROQ_KEY = process.env.GROQ_KEY;

    if (!GROQ_KEY) return res.status(500).json({ error: "Groq Key Missing" });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // موديل خارق وسريع جداً
                messages: [
                    { role: "system", content: "You are ShieldAI, a secure and professional AI assistant." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: "Groq API Error", details: data.error.message });
        }

        const reply = data.choices[0].message.content;
        return res.status(200).json({ reply });

    } catch (err) {
        return res.status(500).json({ error: "Groq Connection Failed" });
    }
}
