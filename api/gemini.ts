import { GoogleGenerativeAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set on server");
}

const client = new GoogleGenerativeAI(apiKey || "");
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

type ReqBody = {
  action?: string;
  data?: any;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body: ReqBody = req.body ?? {};
    const { action, data } = body;

    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY missing" });
      return;
    }

    if (!action) {
      res.status(400).json({ error: "Missing action" });
      return;
    }

    let result: any;

    switch (action) {
      case "identifyObject": {
        const imageBase64: string | undefined = data?.imageBase64;
        const theme = data?.theme;

        if (!imageBase64) {
          res.status(400).json({ error: "Missing imageBase64" });
          return;
        }

        // 去掉 data:image/png;base64 開頭
        const cleaned = imageBase64.replace(
          /^data:image\/[a-zA-Z]+;base64,/,
          ""
        );

        const parts = [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleaned,
            },
          },
          {
            text: `
你是一位幫小朋友做英語學習任務的助教。
現在會給你一張圖片和當前任務主題，請你判斷圖片是否符合主題。

主題資訊（英文顯示給小朋友用）:
name: ${theme?.name ?? "none"}
type: ${theme?.type ?? "none"}
rule: ${theme?.rule ?? ""}

請你輸出嚴格的 JSON 格式，不要多餘解說文字，結構如下:
{
  "word": "圖片中最關鍵的一個英文名詞，例如 apple",
  "definition": "用給幼兒的方式簡單解釋這個詞",
  "visualDetail": "圖片中一個可以提醒孩子注意的視覺細節",
  "matchesTheme": true 或 false,
  "feedback": "給孩子的一句話反饋，例如 That looks perfect for Red World 或 That is red, but try something that is more clearly a single object"
}
如果主題是 Red World 類似這種，請特別注意顏色是否主要是紅色。
請務必只輸出 JSON。`,
          },
        ];

        const gemRes = await model.generateContent({
          contents: [{ role: "user", parts }],
        });

        const text = await gemRes.response.text();

        // 嘗試從回應裡抓出 JSON
        const jsonText = extractJson(text);
        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          parsed = {
            word: "object",
            definition: text,
            visualDetail: "",
            matchesTheme: false,
            feedback:
              "I am not sure this matches the mission. Try another picture.",
          };
        }

        result = parsed;
        break;
      }

      case "lookupWordDefinition": {
        const { word, context, ageGroup } = data ?? {};
        const prompt = `
Explain the word "${word}" for a child.

Age group: ${ageGroup ?? "primary"}
Context: ${context ?? "none"}

Return strict JSON:
{
  "definition": "short and simple explanation",
  "funFact": "one fun fact",
  "emoji": "one emoji",
  "visualDetail": "something they can imagine or see"
}
Only output JSON.`;
        const resp = await model.generateContent(prompt);
        const text = await resp.response.text();
        const jsonText = extractJson(text);
        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          parsed = {
            definition: text,
            funFact: "",
            emoji: "📘",
            visualDetail: "",
          };
        }
        result = parsed;
        break;
      }

      case "generateStoryContent": {
        const { items, theme, kidProfile, userPrompt } = data ?? {};
        const prompt = `
Create a short picture book story for a young child.

Words to include (JSON): ${JSON.stringify(items)}
Theme: ${JSON.stringify(theme)}
Kid profile: ${JSON.stringify(kidProfile)}
Extra prompt: ${userPrompt ?? "none"}

Return strict JSON:
{
  "title": "string",
  "pages": [
    { "pageNumber": 1, "text": "page text" },
    ...
  ],
  "mainCharacterVisual": "short description of how the main character looks"
}
Only output JSON.`;
        const resp = await model.generateContent(prompt);
        const text = await resp.response.text();
        const jsonText = extractJson(text);
        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          parsed = {
            title: "SnapStory Adventure",
            pages: [{ pageNumber: 1, text }],
            mainCharacterVisual: "a curious child explorer",
          };
        }
        result = parsed;
        break;
      }

      case "generateSpeech": {
        const text = data?.text ?? "";
        const resp = await model.generateContent(
          `Read this for a child and return a short friendly version: "${text}"`
        );
        const out = await resp.response.text();
        result = { audioBase64: out };
        break;
      }

      case "generateIllustration": {
        const { prompt, style, characterVisual } = data ?? {};
        const fullPrompt = `
You are helping design an illustration prompt for a children's book.

Story prompt: ${prompt}
Style: ${style}
Main character: ${characterVisual}

Return strict JSON:
{ "imageData": "a short English description of the illustration to draw" }
Only output JSON.`;
        const resp = await model.generateContent(fullPrompt);
        const text = await resp.response.text();
        const jsonText = extractJson(text);
        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          parsed = { imageData: text };
        }
        result = parsed;
        break;
      }

      default: {
        res.status(400).json({ error: `Unknown action "${action}"` });
        return;
      }
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Gemini handler error", err);
    res.status(500).json({
      error: "Gemini request failed",
      detail: String(err?.message ?? err),
    });
  }
}

// 從模型回應裡找出第一段大括號 JSON
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

