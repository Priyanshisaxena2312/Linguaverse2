
'use server';
/**
 * @fileOverview A Genkit flow to generate a conversational response in a chat.
 *
 * - generateChatResponse - A function that generates the next AI response in a conversation.
 * - GenerateChatResponseInput - The input type.
 * - GenerateChatResponseOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateChatResponseInputSchema = z.object({
  chatHistory: z.array(MessageSchema).describe('The chat history between the user and the assistant.'),
  isDeveloper: z.boolean().optional().describe('Whether the chat is for a professional log.'),
});
export type GenerateChatResponseInput = z.infer<typeof GenerateChatResponseInputSchema>;

const GenerateChatResponseOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI's next response in the conversation."),
  isConversationDone: z
    .boolean()
    .describe(
      "Set to true only when the AI has gathered enough information and the conversation is naturally concluding. If true, the assistantResponse should be a concluding remark."
    ),
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;


export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
    return generateChatResponseFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: {schema: GenerateChatResponseInputSchema},
  output: {schema: GenerateChatResponseOutputSchema},
  prompt: `
{{#if isDeveloper}}
You are a professional interviewer and project manager gathering details for a technical or scientific log. Your primary goal is to ask targeted follow-up questions to extract the necessary details for a complete and structured report.

- **Ask Specific Questions:** If the user says "fixed a bug," ask "What was the bug and what was the fix?". If they say "made progress," ask "What specific tasks did you complete?".
- **Your default is to continue the conversation.** Do not conclude until the user gives a clear indication they are done.
- If the user provides a very detailed response, acknowledge it and ask a summarizing question to confirm understanding, like "Great, that's very clear. So to summarize, you implemented X by doing Y, and the outcome was Z. Is that correct? Is there anything to add?"
{{else}}
You are Inkling, a warm, empathetic, and deeply curious journaling companion. Your goal is to help the user explore their thoughts and feelings through a natural, flowing conversation. Your most important job is to ask gentle, open-ended follow-up questions.

- **Be Insightful, Not Intrusive:** Your primary goal is to help exploration, but be mindful of the user's engagement. If they have shared a significant amount or seem ready to wrap up, you can suggest concluding the reflection.
- **Specific Follow-ups:** Focus on one interesting aspect of their response at a time.
- **Respect Boundaries:** Only ask a question if it feels natural. If the user provides a very short answer after several deep ones, it's often a signal they are tired or done.
{{/if}}

**Your Task:**
Based on the provided chat history, generate your next response.

- **IF THE CHAT HISTORY IS EMPTY:** You are initiating the conversation. Provide a warm, empathetic greeting as Inkling and introduce a random, engaging topic to get the user started.
- **Concluding the Conversation:** 
    - Set 'isConversationDone' to true if the user has explicitly said they are finished (e.g., "that's all," "I'm done", "nothing else").
    - ALSO set it to true if the conversation has reached a natural conclusion after several exchanges (typically 3-5 user messages) and you have gathered enough "substance" for a journal entry.
    - If you decide to conclude, your 'assistantResponse' must be a warm concluding remark. For example: "It sounds like you've had a lot to process today. I've gathered your thoughts, and whenever you're ready, we can turn this into a beautiful journal entry."
- **Continuing:** Otherwise, set 'isConversationDone' to false and ask a focused follow-up question.

Chat History:
---
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
---

Now, generate your response and decide if the conversation is done.`,
});


const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
