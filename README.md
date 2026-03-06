# 🛡️ ShieldAI: The Enterprise-Grade AI Privacy Gateway

**ShieldAI** is a high-performance security layer designed to intercept and redact Sensitive PII (Personally Identifiable Information) before it reaches Large Language Models (LLMs). Built for Law Firms, Medical Clinics, and Data-Driven Enterprises.



## 🚀 Key Features
- **Real-time PII Scrubbing:** Automatically detects and masks Emails, Phone Numbers, and API Keys.
- **Ultra-Fast Processing:** Powered by Groq's LPU technology (800+ tokens/sec).
- **Audit Logging:** Comprehensive history of redacted events for compliance (GDPR/HIPAA ready).
- **B2B API Access:** Secure endpoint for integrating privacy into existing corporate workflows.

## 🛠️ Integration for Developers
Companies can integrate ShieldAI into their own apps with a simple POST request:

```bash
curl -X POST [https://your-domain.vercel.app/api/protect](https://your-domain.vercel.app/api/protect) \
     -H "Content-Type: application/json" \
     -d '{"text": "Contact me at admin@company.com", "apiKey": "YOUR_SK_KEY"}'
