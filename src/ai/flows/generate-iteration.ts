'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a structured iteration for a project log.
 *
 * - generateIteration - A function that takes a user's prompt and creates a structured log update.
 * - GenerateIterationInput - The input type for the generateIteration function.
 * - GenerateIterationOutput - The return type for the generateIteration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIterationInputSchema = z.object({
  prompt: z.string().describe("The user's raw notes or prompt for the log update."),
});
export type GenerateIterationInput = z.infer<typeof GenerateIterationInputSchema>;

const GenerateIterationOutputSchema = z.object({
  iterationContent: z.string().describe('The generated, well-structured log update in Markdown format.'),
});
export type GenerateIterationOutput = z.infer<typeof GenerateIterationOutputSchema>;

export async function generateIteration(input: GenerateIterationInput): Promise<GenerateIterationOutput> {
  return generateIterationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIterationPrompt',
  input: {schema: GenerateIterationInputSchema},
  output: {schema: GenerateIterationOutputSchema},
  prompt: `You are an expert technical writer. Your task is to transform a user's raw notes into a well-structured, professional log update or iteration documentation.

The output should be clear, concise, and formatted using Markdown. It should be written as a self-contained update.

- **Structure:** Use bullet points, code blocks, and bold text to structure the information clearly.
- **Clarity:** Elaborate slightly on the user's points to make them clear and professional, but **do not invent new information or add details the user did not provide.**
- **Focus:** The output must focus only on the information provided in the prompt for this specific update. Stick to the facts given by the user, even if they seem incomplete.

User's prompt for this update:
---
{{{prompt}}}
---

Now, generate the structured log update content.`,
});

const generateIterationFlow = ai.defineFlow(
  {
    name: 'generateIterationFlow',
    inputSchema: GenerateIterationInputSchema,
    outputSchema: GenerateIterationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
