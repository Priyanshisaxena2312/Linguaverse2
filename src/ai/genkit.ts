import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Google AI Studio API Key (Free tier: https://aistudio.google.com/app/apikey)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VERTEX_API_KEY;

// Default AI instance for core generation and analysis tasks using Google AI Studio
export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});

export const conversationalAi = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});

export const searchAi = genkit({
  plugins: [googleAI({ apiKey })],
});
