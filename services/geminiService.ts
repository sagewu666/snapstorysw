
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryPage, Theme, LearnedWord, KidProfile } from "../types";

const API_KEY = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const cleanJsonString = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean.trim();
};

// --- AUDIO GENERATION (TTS) ---
export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text || !text.trim()) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio; 
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const identifyObject = async (imageBase64: string, theme?: Theme): Promise<{ word: string, definition: string, visualDetail: string, matchesTheme: boolean, feedback?: string }> => {
  try {
    const cleanData = cleanBase64(imageBase64);
    
    // Construct prompt to strictly guide the AI on SINGLE ITEM validation
    let validationLogic = "";
    
    if (theme) {
      // Reconstruct valid sentence from the theme phrase (e.g. "red things" -> "Find red things")
      const ruleDescription = theme.description.startsWith('Find') ? theme.description : `Find ${theme.description}`;

      validationLogic = `
      GAME MODE: "${theme.label}"
      GAME RULE DESCRIPTION: "${ruleDescription}"

      YOUR ROLE: You are a strict but friendly referee for a children's scavenger hunt.
      
      VALIDATION RULES (CRITICAL):
      1. **IGNORE QUANTITIES**: The user is submitting just **ONE** item in this photo. If the rule implies finding multiple (e.g., "Find 3 red things"), IGNORE the number. Do NOT count items. Just check if the SINGLE main object matches the theme.
      2. **STRICT ATTRIBUTE MATCH**: 
         - If theme is RED: The object must be **mostly** RED. A white bottle with a red cap is NOT red. It is white. Reject it.
         - If theme is ROUND: The object must be round. A square box is NOT round.
      3. **SINGLE FOCUS**: Identify the main, dominant object in the center of the frame.
      
      OUTPUT SCENARIOS:
      - Scenario A: Theme is "Red World". Image is a Red Apple. -> matchesTheme: true, feedback: "Awesome! That is a very red apple!"
      - Scenario B: Theme is "Red World". Image is a Blue Car. -> matchesTheme: false, feedback: "That car is Blue! We need something Red."
      - Scenario C: Theme is "Red World". Image is a White Bottle with red text. -> matchesTheme: false, feedback: "That is mostly white. Find something that is ALL red!"
      `;
    }

    const prompt = `
      Analyze this image for a child's learning app.
      
      ${validationLogic}

      Return a JSON object with:
      1. "word": The name of the main object (e.g., 'Apple').
      2. "definition": A simple definition for a 5-year-old.
      3. "visualDetail": A short description of what it looks like.
      4. "matchesTheme": boolean (Did it pass the validation rules?).
      5. "feedback": string (A short, spoken-style message for the child. Max 15 words. If rejected, explain why simply).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanData } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("No response text");

    const json = JSON.parse(cleanJsonString(response.text));
    
    return {
        word: json.word?.replace(/[^a-zA-Z ]/g, "") || "Object",
        definition: json.definition || "Something cool you found!",
        visualDetail: json.visualDetail || "A mysterious object.",
        matchesTheme: json.matchesTheme !== false, // Default to true if undefined
        feedback: json.feedback
    };

  } catch (error) {
    console.error("Vision API Error:", error);
    return { 
      word: "Mystery", 
      definition: "A magical item.", 
      visualDetail: "A magical item.",
      matchesTheme: true 
    };
  }
};

export const lookupWordDefinition = async (word: string, context: string, ageGroup: string): Promise<{ definition: string; funFact: string; emoji: string; visualDetail: string }> => {
  try {
    const prompt = `
      Explain the word "${word}" to a ${ageGroup} year old child.
      Context sentence from story: "${context}"
      
      Return JSON with:
      1. "definition": Simple 1-sentence explanation suitable for a child.
      2. "funFact": A short, engaging fun fact about it.
      3. "emoji": A single relevant emoji.
      4. "visualDetail": A clear visual description of what this looks like (for generating a picture).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanText = cleanJsonString(response.text || "{}");
    const json = JSON.parse(cleanText);
    return {
        definition: json.definition || `It means ${word}.`,
        funFact: json.funFact || "Words are magic!",
        emoji: json.emoji || "✨",
        visualDetail: json.visualDetail || `A colorful ${word}`
    };
  } catch (error) {
    console.error("Lookup Error:", error);
    return { definition: "A special word in our story.", funFact: "Keep reading to find out more!", emoji: "✨", visualDetail: word };
  }
};

// Updated return type to include character visual
export const generateStoryContent = async (
  items: LearnedWord[],
  theme: Theme,
  kidProfile: KidProfile,
  userPrompt?: string
): Promise<{ title: string; pages: StoryPage[]; mainCharacterVisual: string }> => {
  try {
    const itemContext = items.map(i => `Item: ${i.word} (Looks like: ${i.visualDetail})`).join('\n');
    
    console.log("Generating story with items:", itemContext);

    const prompt = `
      You are writing a short story for a child.
      
      CHILD PROFILE:
      - Age Group: ${kidProfile.ageGroup} years old
      - English Level: ${kidProfile.englishLevel}
      
      THEME: ${theme.label} - ${theme.promptContext}
      
      REQUIRED ITEMS (You MUST include these):
      ${items.map(i => `- ${i.word}`).join('\n')}
      
      USER'S IDEA: "${userPrompt || 'No specific idea, just make it fun!'}"
      
      RULES:
      1. **Protagonist**: Define a consistent main character (e.g., "A brave little rabbit with a blue hat").
      2. **Mandatory**: You MUST use all the REQUIRED ITEMS in the story.
      3. **Highlighting**: When you use a REQUIRED ITEM, you MUST wrap it in asterisks like *this*. Example: "He found a *Red Apple* on the floor."
      4. **Logic**: Use the visual details of the items to make the story coherent.
      5. **Structure**: 5 Pages.
      
      OUTPUT: JSON ONLY.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            mainCharacterVisual: { type: Type.STRING, description: "A short physical description of the main character (e.g. 'a small green robot with one eye')." },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING, description: "Story text with *highlighted* words." },
                },
                required: ["pageNumber", "text"]
              }
            }
          }
        }
      }
    });

    const cleanText = cleanJsonString(response.text || "{}");
    const json = JSON.parse(cleanText);
    
    const pages: StoryPage[] = json.pages.map((p: any) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      fallbackImagePrompt: "" 
    }));

    return { 
        title: json.title || "My Adventure", 
        pages,
        mainCharacterVisual: json.mainCharacterVisual || "A happy adventurer"
    };

  } catch (error) {
    console.error("Story Gen Error:", error);
    
    const w1 = items[0]?.word || "Item";
    return {
      title: "My Magic Day",
      mainCharacterVisual: "A happy child",
      pages: [
        { pageNumber: 1, text: "One day, I went on a big adventure." },
        { pageNumber: 2, text: `I found a *${w1}*! It was very cool.` },
        { pageNumber: 3, text: `Then I saw something else.` },
        { pageNumber: 4, text: `We played together.` },
        { pageNumber: 5, text: "The End." }
      ]
    };
  }
};

export const generateIllustration = async (prompt: string, style: string, characterVisual: string): Promise<string | null> => {
  try {
    // UPDATED PROMPT: Explicitly remove text/words
    const finalPrompt = `Kids book illustration, ${style}. ${characterVisual}. Action: ${prompt}. Colorful, cute, high quality. No text, no words, no letters, no labels, no signboards.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
        }
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                 return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    console.warn("No image data in response for prompt:", finalPrompt);
    return null;
  } catch (error) {
    console.error("Illustration Gen Error:", error);
    return null;
  }
};
