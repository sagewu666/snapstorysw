import { GoogleGenerativeAI } from "@google/genai";

type ReqBody = {
  action?: string;
  data?: any;
};

export default async function handler(req: any, res: any) {
  // 先處理 GET 讓你在瀏覽器裡測試不會報錯
  if (req.method === "GET") {
    res.status(200).json({ ok: true, message: "Gemini endpoint is alive" });
    return;
  }

  // 只拒絕非常奇怪的 method 其他走正常流程
  if (req.method !== "POST") {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  let body: ReqBody = {};
  try {
    body = req.body ?? {};
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { action, data } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY missing on server" });
    return;
  }

  if (action !== "identifyObject") {
    res.status(400).json({ error: `Unknown action "${action}"` });
    return;
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageBase64: string | undefined = data?.imageBase64;
    const theme = data?.theme;

    if (!imageBase64) {
      res.status(400).json({ error: "Missing imageBase64" });
      return;
    }

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
You are helping a young child do an English learning mission.

Mission theme:
${JSON.stringify(theme ?? {}, null, 2)}

Look at the picture and answer in strict JSON only:
{
  "word": "main English noun in the picture",
  "definition": "child friendly explanation",
  "visualDetail": "one visual feature to notice",
  "matchesTheme": true or false,
  "feedback": "one short sentence of feedback"
}
Only output JSON.`,
      },
    ];

    const gemRes = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const text = await gemRes.response.text();
    const jsonText = extractJson(text);

    let result: any;
    try {
      result = JSON.parse(jsonText);
    } catch {
      result = {
        word: "object",
        definition: text,
        visualDetail: "",
        matchesTheme: false,
        feedback:
          "I am not sure this matches the mission. Try another picture.",
      };
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

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}


