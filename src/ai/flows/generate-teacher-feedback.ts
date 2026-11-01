
'use server';

/**
 * @fileOverview A Genkit flow to transform a teacher's raw notes into structured, student-friendly feedback.
 */

import { ai } from '@/ai/genkit';
import { GenerateTeacherFeedbackInputSchema, GenerateTeacherFeedbackOutputSchema, type GenerateTeacherFeedbackInput, type GenerateTeacherFeedbackOutput } from '@/lib/types';


export async function generateTeacherFeedback(input: GenerateTeacherFeedbackInput): Promise<GenerateTeacherFeedbackOutput> {
  return generateTeacherFeedbackFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateTeacherFeedbackPrompt',
  input: { schema: GenerateTeacherFeedbackInputSchema },
  output: { schema: GenerateTeacherFeedbackOutputSchema },
  prompt: `You are an expert, empathetic language teacher. Your task is to convert a fellow teacher's raw, potentially messy notes into a structured, encouraging, and highly effective piece of feedback for a student.

**The teacher's raw notes are:**
---
{{{teacherNotes}}}
---

**The student's original writing was:**
---
{{{studentEntryText}}}
---

**Your feedback MUST follow this structure:**

1.  **Start with Encouragement:** Begin with a positive and encouraging opening. Acknowledge the student's effort or a specific strength in their writing.
2.  **Create Structured Points:** Group the teacher's notes into clear, logical points. Use Markdown for formatting (bolding for emphasis, bullet points for lists). If the teacher pointed out a grammar issue, explain it simply. If they suggested a better word, explain why it's a good alternative.
3.  **Provide Actionable Advice:** For each point, offer a clear, simple suggestion for improvement.
4.  **End with a Positive Summary:** Conclude with a supportive closing statement that motivates the student to keep writing and improving.

**CRITICAL RULE:** Keep your feedback concise and to the point. The length of your feedback should be appropriate to the length of the teacher's notes. If the notes are short and simple, the feedback should also be short and simple. Do not write a long essay for a minor correction.

The language should be clear, simple, and connecting. Avoid overly academic or critical language. The goal is to build the student's confidence while providing them with concrete ways to improve.

Now, generate the structured feedback.`,
});

const generateTeacherFeedbackFlow = ai.defineFlow(
  {
    name: 'generateTeacherFeedbackFlow',
    inputSchema: GenerateTeacherFeedbackInputSchema,
    outputSchema: GenerateTeacherFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
