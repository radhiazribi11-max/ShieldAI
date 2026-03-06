export default async function handler(req, res) {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // منطق مسح البيانات (Redaction Logic)
    let cleanText = text
        .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\+?\d{10,14}/g, '[REDACTED_PHONE]')
        .replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]');

    res.status(200).json({ 
        original: text,
        protected: cleanText,
        timestamp: new Date().toISOString()
    });
}
