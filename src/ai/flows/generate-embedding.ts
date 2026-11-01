
'use server';
/**
 * @fileOverview A Genkit flow to generate a vector embedding for a given text.
 */

import { searchAi } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEmbeddingInputSchema = z.object({
  text: z.string().describe('The text to be embedded.'),
});
export type GenerateEmbeddingInput = z.infer<typeof GenerateEmbeddingInputSchema>;

// The output is an array of numbers (the vector).
const GenerateEmbeddingOutputSchema = z.array(z.number());
export type GenerateEmbeddingOutput = z.infer<typeof GenerateEmbeddingOutputSchema>;


export async function generateEmbedding(input: GenerateEmbeddingInput): Promise<GenerateEmbeddingOutput> {
    const [{ embedding }] = await searchAi.embed({
        embedder: 'googleai/text-embedding-004',
        content: input.text,
    });
    return embedding;
}
