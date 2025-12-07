<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1By9pe5TLtzpyzi4Sa9SsXN2nsnnF2Ci8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare Pages

1. Build command (set this in Cloudflare Pages build settings):
   `npm run build`
2. Output directory (set this in Cloudflare Pages publish settings):
   `.vercel/output/static`
3. Environment variables:
   - Set `GEMINI_API_KEY` in Cloudflare Pages project settings (Production). For local development keep using `.env.local`.

Notes:
- This project is a Vite-based SPA. After `npm run build` the static site files are copied into `.vercel/output/static` so Cloudflare Pages can publish them.
- A Pages Function stub is provided at `functions/gemini.js` to act as a server-side proxy for GenAI calls. Configure `GEMINI_API_KEY` in Pages to allow server-side calls without exposing the key to the browser.
- For increased security, move all direct uses of `@google/genai` out of client-side code and implement the GenAI REST proxy inside `functions/gemini.js`.
