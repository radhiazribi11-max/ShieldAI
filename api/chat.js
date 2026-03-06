export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Method Not Allowed" });
}

const { prompt, licenseKey } = req.body;

if (!licenseKey || licenseKey !== "admin123") {
return res.status(401).json({ error: "Invalid license" });
}

const API_KEY = process.env.GEMINI_KEY;

try {

const aiRes = await fetch(
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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

const data = await aiRes.json();

console.log("Gemini response:", data);

if (!data.candidates) {
return res.status(500).json({
error: "AI did not return candidates",
debug: data
});
}

const reply = data.candidates[0].content.parts[0].text;

return res.status(200).json({ reply });

} catch (error) {

return res.status(500).json({
error: "Server error",
details: error.message
});

}

  }
