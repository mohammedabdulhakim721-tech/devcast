import { GoogleGenAI, Type } from '@google/genai';
import type { CleanedCommitData } from './github';

export type Platform = 'x' | 'linkedin' | 'threads';
export type Vibe = 'casual' | 'technical' | 'witty';

export interface GeneratedContent {
  posts: { style: string; text: string }[];
  snippet: { file: string; lines: string[] };
}

const PLATFORM_RULES: Record<Platform, string> = {
  x: 'Under 250 characters each. Punchy, no hashtag spam (max 1).',
  threads: 'Under 250 characters each. Casual, conversational.',
  linkedin:
    '400-700 characters. Lead with the problem solved, end with the technical takeaway. Professional but human.',
};

const VIBE_RULES: Record<Vibe, string> = {
  casual: 'Casual builder voice, first person, friendly.',
  technical: 'Technical deep-dive: name the actual technique or fix.',
  witty: 'Witty and self-aware, light humor, never cringe.',
};

export async function generateContent(
  commit: CleanedCommitData,
  platform: Platform,
  vibe: Vibe
): Promise<GeneratedContent> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Commit message: ${commit.message}

Code diff:
${commit.diffText}

Write 3 social posts about this commit, in this order with these styles:
1. "One-Liner" 2. "Mini-Story" 3. "Changelog" (short bullet-style list).
Platform rules: ${PLATFORM_RULES[platform]}
Tone: ${VIBE_RULES[vibe]}
Write as the developer who made the change. Do not invent features not in the diff. Do not include links.

Also pick the 6-10 cleanest, most interesting lines from the diff to show on a code card.
Copy them exactly from the diff (keep any leading + or - markers), each under 70 characters, from one file.`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                style: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['style', 'text'],
            },
          },
          snippet: {
            type: Type.OBJECT,
            properties: {
              file: { type: Type.STRING },
              lines: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['file', 'lines'],
          },
        },
        required: ['posts', 'snippet'],
      },
    },
  });

  const parsed = JSON.parse(response.text ?? '{}') as GeneratedContent;
  if (!parsed.posts?.length || !parsed.snippet) {
    throw new Error('AI returned an unexpected response. Try again.');
  }
  parsed.snippet.lines = parsed.snippet.lines.slice(0, 10);
  return parsed;
}
