// 简单测试用 先确认 Vercel 函数本身能跑起来

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    method: req.method,
  });
}

