// api/gemini.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.status(200).json({ text });
  } catch (err) {
    console.error("Gemini api error", err);
    res.status(500).json({ error: "Gemini request failed" });
  }
}
