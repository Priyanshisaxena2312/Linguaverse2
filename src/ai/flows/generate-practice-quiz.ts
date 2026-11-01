
'use server';

/**
 * @fileOverview A Genkit flow to generate a practice quiz from a list of language corrections.
 */

import { ai } from '@/ai/genkit';
import { GeneratePracticeQuizInputSchema, GeneratePracticeQuizOutputSchema, type GeneratePracticeQuizInput, type GeneratePracticeQuizOutput } from '@/lib/types';


export async function generatePracticeQuiz(input: GeneratePracticeQuizInput): Promise<GeneratePracticeQuizOutput> {
    return generatePracticeQuizFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generatePracticeQuizPrompt',
  input: { schema: GeneratePracticeQuizInputSchema },
  output: { schema: GeneratePracticeQuizOutputSchema },
  prompt: `You are a language teacher creating a practice quiz. Your task is to take a list of corrections and turn them into a series of "fill-in-the-blank" multiple-choice questions.

**Instructions:**
1.  For each correction provided, create one unique quiz question.
2.  The question must be a complete sentence containing a blank space (\`___\`).
3.  The blank space should represent the exact location of the original correction.
4.  Generate exactly four options for each question:
    - At least one option MUST be the recommended "suggestion".
    - One option MUST be the user's "original" mistake.
    - The other two options should be plausible distractors related to the topic of the correction.
5.  **Critical Accuracy Check:** Before finalizing, evaluate each of the 4 options against the blank space. 
    - If an option is grammatically and contextually correct (even if it's not the primary suggestion), it **MUST** be added to the \`correctAnswers\` array. 
    - If you find an option that is subtly correct but not marked, you **MUST** mark it. 
    - Set \`isMultiSelect\` to true if \`correctAnswers.length > 1\`.
    - Avoid distractors that are correct but you didn't mean them to be. A distractor must be definitively wrong in the given context.
6.  All strings in \`correctAnswers\` MUST exactly match one of the options in the \`options\` array.
7.  Use the provided 'explanation' as the post-answer feedback for the student.
8.  Generate a maximum of 5 questions. Select the highest-impact corrections.
9.  Maintain a professional, academic, yet encouraging tone.

**Corrections to use:**
---
{{#each corrections}}
- Original: "{{original}}"
- Suggestion: "{{suggestion}}"
- Explanation: "{{explanation}}"
---
{{/each}}

Now, generate the robust quiz questions in the specified JSON format. Ensure full credit is only possible if all valid options are recognized.`,
});

const generatePracticeQuizFlow = ai.defineFlow(
  {
    name: 'generatePracticeQuizFlow',
    inputSchema: GeneratePracticeQuizInputSchema,
    outputSchema: GeneratePracticeQuizOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid quiz response.");
    }
    return output;
  }
);
