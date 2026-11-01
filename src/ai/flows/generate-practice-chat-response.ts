
'use server';

/**
 * @fileOverview A Genkit flow to generate a conversational response for a language practice session.
 * It now also generates a performance report at the end of the session.
 */

import { conversationalAi } from '@/ai/genkit';
import { z } from 'zod';

// --- Schemas (defined internally for stability) ---

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GeneratePracticeChatResponseInputSchema = z.object({
  correctionsToPractice: z.string().describe("A simple, human-readable summary of the user's past mistakes, formatted as a string."),
  chatHistory: z.array(MessageSchema).describe("The ongoing chat history."),
});
export type GeneratePracticeChatResponseInput = z.infer<typeof GeneratePracticeChatResponseInputSchema>;

const GeneratePracticeChatResponseOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI's next response in the conversation."),
  isSessionOver: z.boolean().describe("Set to true only when the practice session is naturally concluding."),
  performanceReport: z.string().nullable().describe("A detailed performance report, generated only when the session is over. Null otherwise."),
});
export type GeneratePracticeChatResponseOutput = z.infer<typeof GeneratePracticeChatResponseOutputSchema>;


// --- Main Exported Function ---
export async function generatePracticeChatResponse(input: GeneratePracticeChatResponseInput): Promise<GeneratePracticeChatResponseOutput> {
  return generatePracticeChatResponseFlow(input);
}


// --- Genkit Definitions ---
const prompt = conversationalAi.definePrompt({
  name: 'generatePracticeChatResponsePrompt',
  input: { schema: GeneratePracticeChatResponseInputSchema },
  output: { schema: GeneratePracticeChatResponseOutputSchema },
  prompt: `You are a friendly and clever language tutor. Your goal is to have a focused conversation with a student to help them practice and correct their past mistakes. Your tone should be encouraging and curious.

**Your Primary Task:**
Your main goal is to create a conversation where the student has an opportunity to use the *correct* word or grammar structure from their list of past mistakes.

**Critical Rules for the Conversation:**
1.  **MANDATORY: ASK AT LEAST 4 QUESTIONS.** You must continue the conversation for at least 4 turns (4 questions from you). Do not conclude the session before you have asked at least 4 relevant questions.
2.  **ALWAYS ASK A QUESTION:** Your response MUST end with an open-ended question that invites more detail. Do not just make a statement and stop.
3.  **BE RELEVANT:** Your questions must be designed to test the mistakes. Don't ask generic questions. If a mistake was about "I'm agree," ask a specific question like, "What's a popular opinion that you strongly agree with?". If a mistake was about "more better," you could ask "What is one thing that made your day better than yesterday?".
4.  **DO NOT CONCLUDE EARLY:** Do not use phrases like "This was a great session!" or "Keep up the great work!" until you have asked at least 4 questions OR the user explicitly says they are finished (e.g., "I'm done", "that's all").

**On Session Conclusion:**
- When you decide the session is over (after at least 4 questions or user says they are done), set \`isSessionOver\` to \`true\`.
- Your \`assistantResponse\` should be a final concluding remark like "This was a great session! You're showing real improvement. Keep up the great work!"
- **Crucially, you must also generate a \`performanceReport\`**. This report should be a concise, Markdown-formatted summary analyzing the user's performance during *this specific chat session*. It should identify which of the original mistakes were corrected successfully and which were repeated.

**Handling the First Turn:**
{{#if chatHistory}}
{{! This block is for subsequent messages }}
This is turn {{chatHistory.length}}. You have already asked questions. Continue the conversation based on the user's last response and the rules above. Ask another relevant question to test a different mistake if possible.
{{else}}
**This is the VERY FIRST message of the conversation.** Your ONLY task is to start the conversation by asking an interesting, open-ended question directly related to one of the user's mistakes. DO NOT conclude the session. Set \`isSessionOver\` to \`false\`.
{{/if}}


**Mistakes to Practice:**
---
{{{correctionsToPractice}}}
---

**Ongoing Conversation:**
---
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
---

Now, based on all the above, generate your next response. If the session is over, provide the final response and the performance report.`,
});

const generatePracticeChatResponseFlow = conversationalAi.defineFlow(
  {
    name: 'generatePracticeChatResponseFlow',
    inputSchema: GeneratePracticeChatResponseInputSchema,
    outputSchema: GeneratePracticeChatResponseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid response.");
    }
    return output;
  }
);
