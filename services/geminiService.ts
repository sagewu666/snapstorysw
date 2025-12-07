import { StoryPage, Theme, LearnedWord, KidProfile } from "../types";

// Client-side proxy for calling the serverless Gemini Function.
// This keeps GEMINI_API_KEY on the server and prevents exposing it in the browser.

async function proxy(action: string, data: any) {
  const res = await fetch('/api/geminiProxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GenAI proxy error: ${res.status} ${text}`);
  }

  return res.json();
}

/* ---------------------------
   Text-to-Speech
---------------------------- */

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text || !text.trim()) return null;
  const r = await proxy('generateSpeech', { text });
  return r?.audioBase64 || null;
};

/* ---------------------------
   Image Object Identification
---------------------------- */

export const identifyObject = async (
  imageBase64: string,
  theme?: Theme
): Promise<{
  word: string;
  definition: string;
  visualDetail: string;
  matchesTheme: boolean;
  feedback?: string;
}> => {
  const r = await proxy('identifyObject', { imageBase64, theme });
  return r;
};

/* ---------------------------
   Word Definition Lookup
---------------------------- */

export const lookupWordDefinition = async (
  word: string,
  context: string,
  ageGroup: string
): Promise<{
  definition: string;
  funFact: string;
  emoji: string;
  visualDetail: string;
}> => {
  const r = await proxy('lookupWordDefinition', { word, context, ageGroup });
  return r;
};

/* ---------------------------
   Story Generation
---------------------------- */

export const generateStoryContent = async (
  items: LearnedWord[],
  theme: Theme,
  kidProfile: KidProfile,
  userPrompt?: string
): Promise<{
  title: string;
  pages: StoryPage[];
  mainCharacterVisual: string;
}> => {
  const r = await proxy('generateStoryContent', {
    items,
    theme,
    kidProfile,
    userPrompt
  });
  return r;
};

/* ---------------------------
   Illustration Generation
---------------------------- */

export const generateIllustration = async (
  prompt: string,
  style: string,
  characterVisual: string
): Promise<string | null> => {
  const r = await proxy('generateIllustration', {
    prompt,
    style,
    characterVisual
  });
  return r?.imageData || null;
};
