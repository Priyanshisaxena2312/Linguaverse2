
'use server';

/**
 * @fileOverview A Genkit flow to generate relevant tags for a journal entry.
 *
 * - generateTags - A function that handles the tag generation process.
 * - GenerateTagsInput - The input type for the generateTags function.
 * - GenerateTagsOutput - The return type for the generateTags function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTagsInputSchema = z.object({
  journalContent: z.string().describe('The full text content of the journal entry.'),
});
export type GenerateTagsInput = z.infer<typeof GenerateTagsInputSchema>;

const GenerateTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of 3-5 concise, relevant tags. Tags should be single words or short two-word phrases (e.g., "Work", "Family", "ReactJS", "ProjectPhoenix").'),
});
export type GenerateTagsOutput = z.infer<typeof GenerateTagsOutputSchema>;

export async function generateTags(input: GenerateTagsInput): Promise<GenerateTagsOutput> {
  return generateTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTagsPrompt',
  input: { schema: GenerateTagsInputSchema },
  output: { schema: GenerateTagsOutputSchema },
  prompt: `You are an expert at analyzing text and extracting key information. Your task is to read the following journal entry and generate a list of 3-5 relevant tags that summarize its main themes, topics, people, or emotions.

**Rules for Tagging:**
- Tags should be concise (1-2 words max).
- Tags should be in PascalCase or a single lowercase word (e.g., "ReactJS", "WorkLifeBalance", "family").
- Focus on the most important topics mentioned.

Journal Entry:
---
{{{journalContent}}}
---

Now, generate the list of tags.
`,
});

const generateTagsFlow = ai.defineFlow(
  {
    name: 'generateTagsFlow',
    inputSchema: GenerateTagsInputSchema,
    outputSchema: GenerateTagsOutputSchema,
  },
  async (input) => {
    // If the content is very short, return empty tags to save API calls
    if (input.journalContent.length < 50) {
        return { tags: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
