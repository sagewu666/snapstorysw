// 極簡測試版 先確認 Vercel 函數本身能不能正常返回

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    method: req.method,
    body: req.body ?? null,
  });
}

