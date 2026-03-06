export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, licenseKey } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  if (!licenseKey || !licenseKey.startsWith("sk_")) {
    return res.status(401).json({ error: "Invalid license" });
  }

  const GEMINI = process.env.GEMINI_KEY;

  try {

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI returned empty response";

    res.status(200).json({ reply });

  } catch (err) {

    res.status(500).json({
      error: "AI Gateway Failed"
    });

  }

                             }
