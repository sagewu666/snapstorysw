// Cloudflare Pages Function stub for proxying GenAI requests.
// Place this file at `functions/gemini.js` so Cloudflare Pages serves it at /api/gemini
// IMPORTANT: Implement real request mapping here to call the Generative Language REST API
// using the `GEMINI_API_KEY` secret set in your Cloudflare Pages environment.

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST from the client
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured in Cloudflare Pages environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Parse body
  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const action = body.action;
  const data = body.data || {};

  if (!action) {
    return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured in Cloudflare Pages environment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Helpers
  const cleanBase64 = (base64) => base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const cleanJsonString = (text) => {
    let clean = (text || '').trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '');
    }
    return clean.trim();
  };

  // Helper to call Google Generative Language REST endpoint
  async function callGenerativeEndpoint(model, payload) {
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(model)}:generate`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    const txt = await resp.text();
    let parsed = txt;
    try { parsed = JSON.parse(txt); } catch (e) { /* keep raw text */ }
    return { status: resp.status, body: parsed };
  }

  try {
    switch (action) {
      case 'generateSpeech': {
        // Return shape: { audioBase64: string }
        const model = data.model || 'gemini-2.5-flash-preview-tts';
        const payload = {
          contents: [{ parts: [{ text: data.text || '' }] }],
          config: { responseModalities: ['AUDIO'] }
        };
        const result = await callGenerativeEndpoint(model, payload);
        try {
          // Try to extract inline audio bytes if present
          if (result?.body?.candidates && Array.isArray(result.body.candidates)) {
            const candidate = result.body.candidates[0];
            const part = candidate?.content?.parts?.[0];
            const inline = part?.inlineData?.data;
            if (inline) {
              return new Response(JSON.stringify({ audioBase64: inline }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            // Sometimes the API returns base64 under different path
            if (candidate?.content?.parts) {
              for (const p of candidate.content.parts) {
                if (p.inlineData && p.inlineData.data) {
                  return new Response(JSON.stringify({ audioBase64: p.inlineData.data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
              }
            }
          }
          // Fallback: return the raw body
          return new Response(JSON.stringify({ raw: result.body }), { status: result.status, headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      case 'identifyObject': {
        // Build prompt similar to previous implementation and include image inline data
        const theme = data.theme || null;
        let validationLogic = '';
        if (theme) {
          const ruleDescription = (theme.description || '').startsWith('Find') ? theme.description : `Find ${theme.description}`;
          validationLogic = `GAME MODE: "${theme.label}"\nGAME RULE DESCRIPTION: "${ruleDescription}"\nYOUR ROLE: You are a strict but friendly referee for a children's scavenger hunt.\nVALIDATION RULES: 1) IGNORE QUANTITIES. 2) STRICT ATTRIBUTE MATCH. 3) SINGLE FOCUS.`;
        }
        const prompt = `Analyze this image for a child's learning app.\n${validationLogic}\nReturn a JSON object with: word, definition, visualDetail, matchesTheme (bool), feedback`;
        const cleanData = cleanBase64(data.imageBase64 || '');
        const model = data.model || 'gemini-2.5-flash';
        const payload = {
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: cleanData } },
              { text: prompt }
            ]
          },
          config: { responseMimeType: 'application/json' }
        };
        const result = await callGenerativeEndpoint(model, payload);
        try {
          // Extract textual candidate and parse JSON
          let t = null;
          if (result?.body?.candidates && Array.isArray(result.body.candidates)) {
            t = result.body.candidates[0]?.content?.parts?.[0]?.text || result.body.candidates[0]?.content?.parts?.[0]?.inlineData?.data;
          }
          if (!t && result?.body?.text) t = result.body.text;
          if (t) {
            const parsed = JSON.parse(cleanJsonString(t));
            // Normalize fields
            const out = {
              word: parsed.word || parsed.name || 'Object',
              definition: parsed.definition || parsed.def || '',
              visualDetail: parsed.visualDetail || parsed.visual || '',
              matchesTheme: parsed.matchesTheme === false ? false : true,
              feedback: parsed.feedback || ''
            };
            return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          // fallback: return raw
          return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      case 'lookupWordDefinition': {
        const { word, context, ageGroup } = data;
        const prompt = `Explain the word "${word}" to a ${ageGroup} year old child. Context: "${context}". Return JSON with definition, funFact, emoji, visualDetail.`;
        const model = data.model || 'gemini-2.5-flash';
        const payload = { contents: prompt, config: { responseMimeType: 'application/json' } };
        const result = await callGenerativeEndpoint(model, payload);
        if (result?.body?.text) {
          try {
            const parsed = JSON.parse(cleanJsonString(result.body.text));
            return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } catch (e) {
            return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
      }

      case 'generateStoryContent': {
        const { items = [], theme = {}, kidProfile = {}, userPrompt = '' } = data;
        const itemContext = (items || []).map(i => `Item: ${i.word} (Looks like: ${i.visualDetail || ''})`).join('\n');
        const prompt = `You are writing a short story for a child. CHILD PROFILE: - Age Group: ${kidProfile.ageGroup || '5'} years old - English Level: ${kidProfile.englishLevel || 'beginner'} THEME: ${theme.label || ''} - ${theme.promptContext || ''} REQUIRED ITEMS: ${items.map(i => `- ${i.word}`).join('\n')} USER'S IDEA: "${userPrompt || 'No specific idea, just make it fun!'}" RULES: 1. Protagonist: Define a consistent main character. 2. Use all REQUIRED ITEMS. 3. Highlight required items with asterisks. 4. Structure: 5 Pages. OUTPUT: JSON with title, mainCharacterVisual, pages[{pageNumber,text}].`;
        const model = data.model || 'gemini-2.5-flash';
        const payload = { contents: prompt, config: { responseMimeType: 'application/json' } };
        const result = await callGenerativeEndpoint(model, payload);
        if (result?.body?.text) {
          try {
            const parsed = JSON.parse(cleanJsonString(result.body.text));
            return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } catch (e) {
            return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
      }

      case 'generateIllustration': {
        const { prompt: p = '', style = 'storybook style', characterVisual = '' } = data;
        const finalPrompt = `Kids book illustration, ${style}. ${characterVisual}. Action: ${p}. Colorful, cute, high quality. No text, no words, no letters, no labels, no signboards.`;
        const model = data.model || 'gemini-image-1';
        const payload = { contents: { parts: [{ text: finalPrompt }] }, config: { imageConfig: { aspectRatio: '1:1' } } };
        const result = await callGenerativeEndpoint(model, payload);
        // Try to extract inline image bytes
        if (result?.body?.candidates && Array.isArray(result.body.candidates)) {
          for (const c of result.body.candidates) {
            if (c?.content?.parts) {
              for (const part of c.content.parts) {
                if (part.inlineData) {
                  return new Response(JSON.stringify({ imageData: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
              }
            }
          }
        }
        return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
