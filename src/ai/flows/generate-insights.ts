'use server';
/**
 * @fileOverview A Genkit flow to generate weekly or monthly insights from journal entries.
 *
 * - generateInsights - A function that handles the insight generation process.
 * - GenerateInsightsInput - The input type for the generateInsights function.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JournalEntryForInsightSchema = z.object({
  createdAt: z.string().describe('The date the entry was created.'),
  content: z.string().describe('The text content of the journal entry.'),
});

const GenerateInsightsInputSchema = z.object({
  entries: z.array(JournalEntryForInsightSchema).describe('A list of journal entries for the period.'),
  timePeriod: z.string().describe('The time period for the insights (e.g., "the past week", "the past month").')
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

const GenerateInsightsOutputSchema = z.object({
  title: z.string().describe('A title for the summary, e.g., "Your Weekly Reflection".'),
  summary: z.string().describe('A short, engaging paragraph summarizing the key takeaways from the journal entries for the period.'),
  keyThemes: z.array(z.string()).describe('A list of 3-5 main themes or recurring topics found in the entries.'),
  emotionalTrend: z.string().describe('A brief description of the overall emotional trajectory during this period (e.g., "fluctuating," "mostly positive," "trending upwards").'),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: {schema: GenerateInsightsInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are an insightful and empathetic life coach. Your task is to analyze a user's journal entries from {{{timePeriod}}} and provide a constructive, high-level summary. Avoid being overly clinical. Focus on identifying patterns and themes in a helpful way.

Analyze the following journal entries:
---
{{#each entries}}
Date: {{createdAt}}
Entry: {{{content}}}
---
{{/each}}

Based on these entries, please generate:
1.  A suitable title for the summary.
2.  A concise summary that captures the essence of the user's experience during this period.
3.  A list of the top 3-5 key themes you identified (e.g., "Work-Life Balance," "Creative Pursuits," "Family Relationships").
4.  A brief, non-judgmental description of the emotional trend you observed.

Return the analysis in the specified JSON format.
`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
