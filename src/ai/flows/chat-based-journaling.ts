'use server';

/**
 * @fileOverview A chat-based journaling AI agent.
 *
 * - chatBasedJournaling - A function that handles the chat-based journaling process.
 */

import {ai} from '@/ai/genkit';
import type { ChatBasedJournalingInput, ChatBasedJournalingOutput } from '@/lib/types';
import { ChatBasedJournalingInputSchema, ChatBasedJournalingOutputSchema } from '@/lib/types';


export async function chatBasedJournaling(input: ChatBasedJournalingInput): Promise<ChatBasedJournalingOutput> {
  return chatBasedJournalingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatBasedJournalingPrompt',
  input: {schema: ChatBasedJournalingInputSchema},
  output: {schema: ChatBasedJournalingOutputSchema},
  prompt: `
{{#if isDeveloper}}
You are an expert at creating clear, structured, and professional logs from conversations for any technical or scientific field. Your task is to transform this chat into a well-structured professional log, lab note, or documentation snippet.

**Crucially, you must only use information explicitly provided by the user in the chat history. Do not add, invent, or infer any details, functions, data, or logic that were not discussed.**

The output should be formatted using Markdown for clarity. Structure the log with appropriate headers based on the content provided.
- **MANDATORY:** At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags (e.g., #ProjectPhoenix #BugFix #React).
{{else}}
You are a warm, empathetic, and insightful journaling companion. You have just had a conversation with a user about their day. Your task is to distill this chat into a single, beautifully written, personal journal entry from the user's first-person perspective ("I", "my").

The entry should feel like a genuine reflection, not a robotic summary of the chat.
- **Capture the Essence:** Synthesize the key events, thoughts, and feelings from the conversation.
- **Human Tone:** Use natural, conversational language.
- **Create a Title:** Generate a concise and evocative title that reflects the main theme of the entry.
- **MANDATORY Auto-Tagging**: At the very end of the entry, you MUST generate a new line and then 3-5 relevant hashtags based on the content (e.g., #Family #Work #Gratitude). This is a required part of the output.
{{#if tone}}
The user has requested a '{{{tone}}}' tone for this entry. Weave this feeling throughout the text.
{{/if}}
{{#if style}}
The user has requested a '{{{style}}}' style for this entry.
{{/if}}
{{/if}}

Here is the chat history:
---
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
---

Now, generate the title and the journal entry. The journal entry MUST end with hashtags.`,
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

const chatBasedJournalingFlow = ai.defineFlow(
  {
    name: 'chatBasedJournalingFlow',
    inputSchema: ChatBasedJournalingInputSchema,
    outputSchema: ChatBasedJournalingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
