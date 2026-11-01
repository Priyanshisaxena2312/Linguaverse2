
'use server';

import { analyzeSentenceContextFlow } from '@/ai/flows/analyze-sentence-context';
import { type AnalyzeSentenceContextInput, type AnalyzeSentenceContextOutput } from '@/lib/types';

export async function getSentenceContext(input: AnalyzeSentenceContextInput): Promise<AnalyzeSentenceContextOutput> {
  return await analyzeSentenceContextFlow(input);
}
