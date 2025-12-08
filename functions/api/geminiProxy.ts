export const onRequestPost: PagesFunction = async (context) => {
  const body = await context.request.json();
  // 在这里调用 GoogleGenerativeAI
  return new Response(JSON.stringify({ ... }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ ok: true, message: "geminiProxy is working" }),
    { headers: { "Content-Type": "application/json" } }
  );
};
