export function sanitizeInput(text) {
    let cleaned = text;
    // إيميلات، أرقام هواتف، ومفاتيح API
    cleaned = cleaned.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, "[EMAIL_HIDDEN]");
    cleaned = cleaned.replace(/(\+?\d[\d -]{8,}\d)/g, "[PHONE_HIDDEN]");
    cleaned = cleaned.replace(/sk-[a-zA-Z0-9]{20,}/g, "[API_KEY_HIDDEN]");
    return cleaned;
}
