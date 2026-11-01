
'use server';

/**
 * @fileOverview A Genkit flow for generating a conversational response to a journal entry.
 * This flow is designed for introspection, helping users explore their own thoughts.
 *
 * - generateJournalChatResponse - The main function to generate a chat response.
 * Note: The Zod schemas for input/output are now defined in the calling server action
 * to avoid exporting non-functions from a 'use server' file.
 */

import { conversationalAi } from '@/ai/genkit';
import { z } from 'zod';

// Define schemas internally, but do not export them.
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const InternalGenerateJournalChatResponseInputSchema = z.object({
  journalContent: z.string().describe('The full, plain text content of the journal entry serving as the context for this conversation.'),
  chatHistory: z.array(MessageSchema).describe('The ongoing chat history between the user and the assistant about this specific journal entry.'),
});
type GenerateJournalChatResponseInput = z.infer<typeof InternalGenerateJournalChatResponseInputSchema>;


const InternalGenerateJournalChatResponseOutputSchema = z.object({
  assistantResponse: z.string().describe("The AI's next response in the conversation."),
});
type GenerateJournalChatResponseOutput = z.infer<typeof InternalGenerateJournalChatResponseOutputSchema>;


export async function generateJournalChatResponse(input: GenerateJournalChatResponseInput): Promise<GenerateJournalChatResponseOutput> {
  return generateJournalChatResponseFlow(input);
}

const prompt = conversationalAi.definePrompt({
  name: 'generateJournalChatResponsePrompt',
  input: { schema: InternalGenerateJournalChatResponseInputSchema },
  output: { schema: InternalGenerateJournalChatResponseOutputSchema },
  prompt: `You are an insightful and empathetic journaling companion. Your role is to help the user explore the thoughts and feelings in their journal entry with gentle curiosity. You are not a generic chatbot; you are a reflective partner.

**Your Core Task:**
Based on the provided journal entry and the ongoing conversation history, generate a thoughtful, open-ended question or a reflective comment that encourages the user to delve deeper into their own experience.

**Rules:**
1.  **Stay Grounded in the Text:** Your questions and reflections MUST be based *only* on the information present in the original journal entry and the user's subsequent replies.
2.  **No Hallucination:** Do NOT invent events, people, or feelings. Do not make assumptions. If the user mentions "a friend," refer to them as "that friend," not by an invented name.
3.  **Ask Open-Ended Questions:** Avoid simple yes/no questions. Instead of "Were you sad?", ask "What was that feeling of sadness like for you at that moment?".
4.  **Be a Mirror, Not a Guru:** Your goal is to help the user see their own thoughts more clearly, not to give advice or solutions. Use phrases like:
    - "You mentioned feeling 'overwhelmed.' Could you tell me more about what that was like?"
    - "It sounds like the conversation with your boss was a key moment. What was going through your mind right after it ended?"
    - "I noticed you wrote about both excitement and nervousness. How did those two feelings interact for you?"
5.  **Keep it Conversational:** Respond naturally to the user's last message in user's  own language like if he is speaking english, speak english, if hinglish then hinglish, if hindi then hindi and so on..., using the full chat history for context.

---
**Original Journal Entry (Primary Context):**
{{{journalContent}}}
---
**Ongoing Conversation:**
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}
---

Now, based on all the above, generate your next response.`,
});

const generateJournalChatResponseFlow = conversationalAi.defineFlow(
  {
    name: 'generateJournalChatResponseFlow',
    inputSchema: InternalGenerateJournalChatResponseInputSchema,
    outputSchema: InternalGenerateJournalChatResponseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
