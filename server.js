// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ====== Functies voor energie & CO₂ berekening ======
function berekenImpact(prompt) {
  const tokens = prompt.length;
  const energie = (tokens * 0.0005).toFixed(4); // Wh
  const co2 = (energie * 0.233).toFixed(4);     // gram CO2
  return { tokens, energie, co2 };
}

function bepaalEcoScore(tokens) {
  if (tokens < 50) return "A";
  if (tokens < 100) return "B";
  if (tokens < 200) return "C";
  if (tokens < 300) return "D";
  return "E";
}

// ====== API Endpoint ======
app.post("/api/prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Geen prompt ontvangen." });

    const { tokens, energie, co2 } = berekenImpact(prompt);
    const ecoScore = bepaalEcoScore(tokens);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Geef een kort, helder en samenvattend antwoord in het Nederlands." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const antwoord = completion.choices[0].message.content.trim();
    res.json({ antwoord, energie, co2, ecoScore });
  } catch (error) {
    console.error("API fout:", error.message);
    res.status(500).json({ error: "Fout bij verwerken van prompt." });
  }
});

app.get("/", (req, res) => {
  res.send("EcoPrompt backend draait 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EcoPrompt-server actief op poort ${PORT}`));

