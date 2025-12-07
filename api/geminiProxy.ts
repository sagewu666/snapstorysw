// api/geminiProxy.ts 最小测试版

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    message: "geminiProxy is working",
    method: req.method,
  });
}


