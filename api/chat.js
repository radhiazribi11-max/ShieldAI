export default async function handler(req,res){

if(req.method!=="POST")
return res.status(405).json({error:"Method Not Allowed"})

const {prompt,licenseKey}=req.body

const SB_URL="https://xjjuvagvfaocvszztkgh.supabase.co"
const SB_KEY="sb_publishable_vhoqtLU78J0jm5vVb5P0Jg_OFMXQ4Fl"

// التحقق من المفتاح
const check = await fetch(
`${SB_URL}/rest/v1/customers?api_key=eq.${licenseKey}`,
{
headers:{
apikey:SB_KEY,
Authorization:`Bearer ${SB_KEY}`
}
}
)

const data = await check.json()

if(!data.length){

return res.status(401).json({
error:"Invalid license"
})

}

const GEMINI=process.env.GEMINI_KEY

try{

const ai = await fetch(
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI}`,
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}]
})
}
)

const result = await ai.json()

const reply =
result.candidates?.[0]?.content?.parts?.[0]?.text
|| "AI error"

res.status(200).json({reply})

}catch(err){

res.status(500).json({error:"Gateway error"})

}

  }
