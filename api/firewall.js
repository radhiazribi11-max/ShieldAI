export function scanPrompt(text) {
    const rules = {
        EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g,
        PHONE: /\+?\d{10,15}/g,
        API_KEY: /(sk|pk|key|api|token)-[a-zA-Z0-9]{20,}/gi, // فلتر مفاتيح البرمجة
        CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g, // فلتر البطاقات الائتمانية
        PROMPT_INJECTION: /ignore all previous instructions|system prompt|reveal secret/gi
    };

    let clean = text;
    let piiCount = 0;
    let detectedTypes = [];

    for (const [type, regex] of Object.entries(rules)) {
        if (regex.test(clean)) {
            const matches = clean.match(regex);
            piiCount += matches.length;
            detectedTypes.push(type);
            clean = clean.replace(regex, `[REDACTED_${type}]`);
        }
    }

    return { clean, blocked: piiCount > 0, piiCount, detectedTypes };
              }

