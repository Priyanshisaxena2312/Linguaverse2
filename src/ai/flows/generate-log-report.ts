
'use server';

/**
 * @fileOverview A Genkit flow to generate a summary report for a project log.
 * This flow takes the main goal and all iterative updates and synthesizes them into a cohesive report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPlainTextFromTiptapJson, ensureTiptapJson } from '@/lib/utils';
import type { LogIteration } from '@/lib/types';
import { decrypt } from '@/lib/encryption';


const GenerateLogReportInputSchema = z.object({
  title: z.string().describe('The main title of the project.'),
  mainGoal: z.any().describe('The main goal or description of the project, in Tiptap JSON format.'),
  iterations: z.array(z.object({
      id: z.string(),
      created_at: z.string(),
      content: z.any(), // Iteration content is Tiptap JSON
  })).describe('A list of all iterative updates made to the project log.'),
});
export type GenerateLogReportInput = z.infer<typeof GenerateLogReportInputSchema>;

const GenerateLogReportOutputSchema = z.object({
  report: z.string().describe('The full, well-structured project report in Markdown format.'),
});
export type GenerateLogReportOutput = z.infer<typeof GenerateLogReportOutputSchema>;


export async function generateLogReport(input: GenerateLogReportInput): Promise<GenerateLogReportOutput> {
  // THE FIX: Decrypt the content before trying to convert it to plain text.
  const decryptedMainGoal = ensureTiptapJson(decrypt(input.mainGoal));
  const plainTextMainGoal = getPlainTextFromTiptapJson(decryptedMainGoal);
  
  const plainTextIterations = input.iterations.map(it => {
    const decryptedIterationContent = ensureTiptapJson(decrypt(it.content));
    return {
        created_at: it.created_at,
        content: getPlainTextFromTiptapJson(decryptedIterationContent),
    }
  });
  
  return generateLogReportFlow({ 
      title: input.title, 
      mainGoal: plainTextMainGoal, 
      iterations: plainTextIterations 
  });
}

// Internal Zod schema using plain text for the AI prompt
const InternalLogReportInputSchema = z.object({
    title: z.string(),
    mainGoal: z.string(),
    iterations: z.array(z.object({
        created_at: z.string(),
        content: z.string(),
    }))
});


const prompt = ai.definePrompt({
  name: 'generateLogReportPrompt',
  input: { schema: InternalLogReportInputSchema },
  output: { schema: GenerateLogReportOutputSchema },
  prompt: `You are a professional technical writer and project manager. Your task is to synthesize a project's main goal and a series of iterative updates into a single, cohesive, and well-structured report.

The report should be in Markdown format.

Project Title: {{{title}}}
---
Main Goal/Objective:
{{{mainGoal}}}
---

Iterative Updates (in chronological order):
{{#each iterations}}
Date: {{created_at}}
Update: {{{content}}}
---
{{/each}}

Based on all the information provided, generate a comprehensive report that includes the following sections:
1.  **Executive Summary:** A brief, high-level overview of the project's purpose and current status.
2.  **Key Accomplishments:** A bulleted list of the most significant achievements and milestones reached.
3.  **Challenges & Solutions:** A description of any problems encountered and how they were addressed. If no challenges were mentioned, state that the project proceeded smoothly.
4.  **Detailed Chronological Log:** A summary of the progress made over time.
5.  **Next Steps / Future Work:** A section outlining what is planned next, if mentioned in the logs. If not mentioned, state that next steps are to be determined.

The final output should be a single Markdown string in the 'report' field.`,
});

const generateLogReportFlow = ai.defineFlow(
  {
    name: 'generateLogReportFlow',
    inputSchema: InternalLogReportInputSchema,
    outputSchema: GenerateLogReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
