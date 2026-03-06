import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
return res.status(200).end();
}

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const { prompt, licenseKey } = req.body;

if (!prompt) {
return res.status(400).json({ reply: "Prompt missing" });
}

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_KEY
);

const { data: user, error } = await supabase
.from("usage_tracking")
.select("*")
.eq("license_key", licenseKey)
.single();

if (error || !user) {
return res.status(403).json({ reply: "Invalid license" });
}

if (user.usage_count >= user.max_limit) {
return res.status(403).json({ reply: "Credit limit reached" });
}

const aiResponse = await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method: "POST",
headers: {
"Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
model: "llama3-8b-8192",
messages: [
{
role: "system",
content: "You are ShieldAI secure assistant."
},
{
role: "user",
content: prompt
}
]
})
}
);

const aiData = await aiResponse.json();

if (!aiData.choices) {
return res.status(500).json({ reply: "Groq API error" });
}

const aiReply = aiData.choices[0].message.content;

await supabase
.from("usage_tracking")
.update({ usage_count: user.usage_count + 1 })
.eq("license_key", licenseKey);

return res.status(200).json({ reply: aiReply });

} catch (err) {

return res.status(500).json({
reply: "Server error: " + err.message
});

}

  }
