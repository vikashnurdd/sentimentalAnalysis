import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 8000;

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/sentiment", async (req, res) => {
  try {
    const { comments } = req.body;

    if (!comments || !Array.isArray(comments)) {
      return res.status(400).json({ error: "Please send comments as an array" });
    }

    const prompt = `
You are an expert in sentiment analysis.
Analyze the following array of comments (including emojis) and return only a valid JSON object with the structure below.

Requirements:
1. positivePercentage, neutralPercentage, negativePercentage → Percentage distribution of sentiments (total = 100%). Round to two decimals.
2. totalComments → Total number of comments analyzed.
3. positiveComments, neutralComments, negativeComments → Numeric count of comments per sentiment category.
4. Ensure the output is valid JSON only (no extra text, no explanation).

JSON Schema:
{
  "positivePercentage": number,
  "neutralPercentage": number,
  "negativePercentage": number,
  "totalComments": number,
  "positiveComments": number,
  "neutralComments": number,
  "negativeComments": number
}

Comments to analyze:
${JSON.stringify(comments, null, 2)}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    let resultJSON;
    try {
      resultJSON = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({ error: "Failed to parse model output" });
    }

    res.json(resultJSON);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`✅ Sentiment API running at http://localhost:${port}`);
});
