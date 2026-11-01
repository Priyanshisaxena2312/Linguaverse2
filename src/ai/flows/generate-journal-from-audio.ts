'use server';

/**
 * @fileOverview A Genkit flow to generate a journal entry from an audio recording.
 *
 * - generateJournalFromAudio - A function that handles the audio-to-journal process.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const GenerateJournalFromAudioInputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the audio recording. Must include MIME type and use Base64 encoding. e.g., 'data:audio/webm;base64,...'"),
  tone: z.string().optional().describe('The desired emotional tone for a personal entry (e.g., reflective, grateful).'),
  outputLanguage: z.string().describe('The desired output language for the final entry (e.g., "English", "Spanish").'),
  isDeveloper: z.boolean().optional().describe('If true, generate a structured, professional log instead of a personal journal entry.'),
});
export type GenerateJournalFromAudioInput = z.infer<typeof GenerateJournalFromAudioInputSchema>;

const GenerateJournalFromAudioOutputSchema = z.object({
  title: z.string().describe('A concise and fitting title for the journal entry.'),
  journalEntry: z.string().describe('The fully generated journal entry in the specified output language. For developers, this is in Markdown format. For personal entries, this is in first-person prose. This must end with hashtags.'),
  clarificationQuestion: z.string().nullable().describe("If the audio is unclear or lacks detail, this field should contain a question to ask for more information. Otherwise, it should be null."),
});
export type GenerateJournalFromAudioOutput = z.infer<typeof GenerateJournalFromAudioOutputSchema>;


export async function generateJournalFromAudio(input: GenerateJournalFromAudioInput): Promise<GenerateJournalFromAudioOutput> {
  return generateJournalFromAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJournalFromAudioPrompt',
  input: {schema: GenerateJournalFromAudioInputSchema},
  output: {schema: GenerateJournalFromAudioOutputSchema},
  prompt: `
You are an expert at processing audio recordings and generating journal entries. First, accurately transcribe the user's spoken words from the provided audio. Then, based on the transcription and the requested journal type, create a high-quality journal entry.

{{#if isDeveloper}}
Your persona is an expert at creating clear, structured, and professional logs from spoken descriptions for any technical or scientific field. Your task is to transform the user's spoken words into a well-structured professional log, lab note, or documentation snippet.

**Crucially, you must only use information explicitly provided in the audio. Do not invent any events, details, code, functions, data, or logic that were not mentioned.**

The output should be formatted using Markdown for clarity. Structure the log with appropriate headers based on the content provided.
- **MANDATORY:** At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags (e.g., #ProjectPhoenix #BugFix #React).
{{else}}
Your persona is a warm, empathetic, and insightful journaling companion. Your main task is to listen to a user's spoken thoughts and transform them into a beautifully written, personal journal entry. The entry must feel authentic, human, and reflective, written from a first-person perspective ("I", "my"). It should not sound like a robotic summary.
- **Human Tone:** Use natural, conversational language. Focus on the emotions and experiences shared.
- **Create Title:** Generate a concise and evocative title for the entry.
- **MANDATORY Auto-Tagging**: At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags based on the content (e.g., #Family #Work #Gratitude). This is a required part of the output.
{{#if tone}}
The user has requested a '{{{tone}}}' tone for this entry. Weave this feeling throughout the text.
{{/if}}
{{/if}}

**Common Instructions:**
- **Strictly from Audio:** **Crucially, you must only use information explicitly provided in the audio. Do not invent any events, details, code, functions, or logic that were not mentioned.**
- **Handle Ambiguity:** If any part of the audio is unclear or seems incomplete for your task (whether personal or professional), generate a specific question for the user in the 'clarificationQuestion' field. Then, write the journal entry based *only* on what you could clearly understand. Do not guess.
- **Language:** All output (title, entry, and any clarification question) must be in {{{outputLanguage}}}.

Audio for transcription: {{media url=audioDataUri}}

Now, provide the final output in the specified JSON format. The journal entry MUST end with hashtags.`,
  // Disable safety filters to allow for authentic, unfiltered user expression.
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateJournalFromAudioFlow = ai.defineFlow(
  {
    name: 'generateJournalFromAudioFlow',
    inputSchema: GenerateJournalFromAudioInputSchema,
    outputSchema: GenerateJournalFromAudioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
