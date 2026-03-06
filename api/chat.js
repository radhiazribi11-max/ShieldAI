export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, licenseKey } = req.body;

  if (!licenseKey || (!licenseKey.startsWith("sk_") && licenseKey !== "admin123")) {
    return res.status(401).json({ error: "Unauthorized Access" });
  }

  const API_KEY = process.env.GEMINI_KEY;

  try {

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        error: "Google API Error",
        details: data.error.message
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI returned empty response";

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({
      error: "ShieldAI Gateway Failure",
      details: error.message
    });
  }

        }
