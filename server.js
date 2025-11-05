import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simpele berekening energie + CO₂
function berekenImpact(prompt) {
  const tokens = prompt.length;
  const energie = (tokens * 0.0005).toFixed(4);
  const co2 = (energie * 0.233).toFixed(4);
  return { tokens, energie, co2 };
}
function bepaalEcoScore(tokens) {
  if (tokens < 50) return "A";
  if (tokens < 100) return "B";
  if (tokens < 200) return "C";
  if (tokens < 300) return "D";
  return "E";
}

app.post("/api/prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Geen prompt ontvangen." });

    const { tokens, energie, co2 } = berekenImpact(prompt);
    const ecoScore = bepaalEcoScore(tokens);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Je bent een behulpzame AI die kort en samenvattend antwoord geeft in het Nederlands." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const antwoord = completion.choices[0].message.content.trim();
    res.json({ antwoord, energie, co2, ecoScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Er is een fout opgetreden bij het verwerken van de prompt." });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`EcoPrompt-server actief op poort ${process.env.PORT || 3000}`)
);
