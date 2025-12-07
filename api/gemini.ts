// api/gemini.ts  供 Vercel 使用的后端函數

import { GoogleGenerativeAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set on the server");
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

type RequestBody = {
  action?: string;
  data?: any;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body: RequestBody;
  try {
    body = req.body ?? {};
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { action, data } = body;

  if (!action) {
    res.status(400).json({ error: "Missing action" });
    return;
  }

  try {
    let result: any;

    switch (action) {
      case "generateSpeech": {
        // 這裏先簡單返回文字 你可以之後換成真正的音訊生成功能
        const text = data?.text ?? "";
        const resp = await model.generateContent(
          `Read this text aloud for a child: "${text}".`
        );
        const out = await resp.response.text();
        result = { audioBase64: out };
        break;
      }

      case "identifyObject": {
        const theme = data?.theme;
        const prompt = `
You are helping a young child learn English words.

Image description (base64 not shown here): ${data?.imageBase64?.slice(
          0,
          40
        )}...

Theme: ${theme?.name ?? "none"}

Please answer in JSON with fields:
word: the key English noun
definition: simple child friendly explanation
visualDetail: one visual feature to notice
matchesTheme: true or false
feedback: short one sentence feedback for the child
`;

        const resp = await model.generateContent(prompt);
        const text = await resp.response.text();

        // 為了簡單 這裏直接把整段文字放在 definition 裏
        // 如果你在原來的 functions/gemini.js 裏有更細緻的解析邏輯 可以把那段搬過來替換這裏
        result = {
          word: theme?.name ?? "item",
          definition: text,
          visualDetail: "",
          matchesTheme: true,
          feedback: "Nice job exploring and taking a picture!",
        };
        break;
      }

      case "lookupWordDefinition": {
        const { word, context, ageGroup } = data ?? {};
        const prompt = `
Explain the word "${word}" for a child (age group: ${ageGroup}).

Context: ${context}

Answer in JSON with:
definition: short and simple
funFact: one fun fact
emoji: one emoji
visualDetail: a visual feature or image idea
`;
        const resp = await model.generateContent(prompt);
        const text = await resp.response.text();
        result = { definition: text, funFact: "", emoji: "📘", visualDetail: "" };
        break;
      }

      case "generateStoryContent": {
        const { items, theme, kidProfile, userPrompt } = data ?? {};
        const prompt = `
Create a short picture book story for a young child.

Words to include: ${JSON.stringify(items)}
Theme: ${JSON.stringify(theme)}
Kid profile: ${JSON.stringify(kidProfile)}
Extra prompt from adult or child: ${userPrompt ?? "none"}

Return a JSON object with:
title: string
pages: array of { pageNumber: number, text: string }
mainCharacterVisual: a short description of how the main character looks
`;
        const resp = await model.generateContent(prompt);
        const text = await resp.response.text();
        // 暫時直接把整段文字放在一頁裏 方便先跑通
        result = {
          title: "SnapStory Adventure",
          pages: [{ pageNumber: 1, text }],
          mainCharacterVisual: "A curious child explorer",
        };
        break;
      }

      case "generateIllustration": {
        const { prompt, style, characterVisual } = data ?? {};
        const fullPrompt = `
Create an illustration description for a children's picture book.

Story prompt: ${prompt}
Style: ${style}
Main character visual: ${characterVisual}

Return only a short text description of the image to draw.
`;
        const resp = await model.generateContent(fullPrompt);
        const text = await resp.response.text();
        result = { imageData: text };
        break;
      }

      default: {
        res.status(400).json({ error: `Unknown action "${action}"` });
        return;
      }
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Gemini api error", err);
    res
      .status(500)
      .json({ error: "Gemini request failed", detail: String(err?.message ?? err) });
  }
}
