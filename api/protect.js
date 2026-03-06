import { sanitizeInput } from "./privacy.js";

export default function handler(req, res) {
    // هذا الملف مخصص ليكون API خارجي للشركات
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { text, apiKey } = req.body;

    // هنا يمكنك مستقبلاً التحقق من اشتراك الشركة عبر الـ apiKey
    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    // تنظيف النص باستخدام المحرك الذي صنعناه
    const cleanedText = sanitizeInput(text);

    // إرسال النص النظيف للشركة
    res.status(200).json({
        original: text,
        protected: cleanedText,
        status: "Shielded by ShieldAI",
        timestamp: new Date().toISOString()
    });
}

