export const config = { runtime: 'nodejs20' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GOOGLE_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_KEY) return res.status(500).json({ error: 'GOOGLE_API_KEY env var not set on Vercel' });

  const { imageData, mimeType, prompt, system } = req.body;
  if (!imageData || !mimeType) return res.status(400).json({ error: 'Missing imageData or mimeType' });

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [
          { inlineData: { mimeType, data: imageData } },
          { text: prompt }
        ]}],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      })
    }
  );

  const data = await geminiRes.json();
  if (!geminiRes.ok) return res.status(geminiRes.status).json({ error: data?.error?.message || 'Gemini error' });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return res.status(200).json({ text });
}
