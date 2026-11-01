
'use server';

/**
 * @fileOverview A Genkit flow to generate a detailed admin report from dashboard data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StudentParticipationSchema = z.object({
  assignment_id: z.string(),
  assignment_title: z.string(),
  submission_count: z.number(),
});

const AssignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  due_date: z.string().nullable(),
  created_at: z.string(),
});

const GenerateAdminReportInputSchema = z.object({
  className: z.string(),
  totalStudents: z.number(),
  totalSubmissions: z.number(),
  avgGrammarScore: z.number().nullable(),
  assignments: z.array(AssignmentSchema),
  studentParticipation: z.array(StudentParticipationSchema),
});
export type GenerateAdminReportInput = z.infer<typeof GenerateAdminReportInputSchema>;

const GenerateAdminReportOutputSchema = z.object({
  report: z.string().describe('The full, comprehensive class analysis report in Markdown format.'),
});
export type GenerateAdminReportOutput = z.infer<typeof GenerateAdminReportOutputSchema>;


export async function generateAdminReport(input: GenerateAdminReportInput): Promise<GenerateAdminReportOutput> {
  return generateAdminReportFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateAdminReportPrompt',
  input: { schema: GenerateAdminReportInputSchema },
  output: { schema: GenerateAdminReportOutputSchema },
  prompt: `You are a Senior Data Analyst and Educational Strategist. Your task is to analyze raw data for a specific class and generate an insightful, well-structured report for the teacher in Markdown format.

**Class Data for: {{className}}**
- Total Students: {{{totalStudents}}}
- Total Submissions (All Time): {{{totalSubmissions}}}
- Average Grammar Score (All Time): {{{avgGrammarScore}}}
- Recent Assignments: {{assignments.length}}
- Participation Data available for {{studentParticipation.length}} assignments.

---

**Structure your report as follows:**

### **1. Executive Summary**
   - Start with a high-level overview. What is the current state of the class's engagement and performance based on this data?

### **2. Key Performance Indicators (KPIs)**
   - Present the main numbers clearly (Total Students, Total Submissions, Average Grammar Score).
   - If Average Grammar Score is null, state that there is not enough data.

### **3. Student Engagement & Participation**
   - Calculate the overall participation rate. A simple way is to consider the total number of submissions against the total number of opportunities (e.g., total students * number of assignments).
   - Analyze the participation per assignment. Are there specific assignments that had significantly higher or lower submission rates? Mention them.
     - Participation per assignment: {{#each studentParticipation}}{{assignment_title}}: {{submission_count}} / {{totalStudents}} students. {{/each}}
   - Provide an interpretation. Is engagement consistent? Is it trending up or down?

### **4. Academic Performance**
   - Discuss the Average Grammar Score. Is it strong, average, or an area for improvement? (Consider a score > 80 strong, 60-80 average, < 60 as an area for focus).
   - What might this score indicate about the students' current writing abilities?

### **5. Strategic Recommendations**
   - Based on *all* the data, provide 2-3 actionable recommendations for the teacher.
   - **Example:** If participation is low on a specific type of assignment, suggest ways to make it more engaging.
   - **Example:** If the grammar score is low, recommend focusing on a specific grammar workshop or providing more targeted feedback.
   - **Example:** If engagement is high, suggest a more challenging follow-up assignment to maintain momentum.
`,
});

const generateAdminReportFlow = ai.defineFlow(
  {
    name: 'generateAdminReportFlow',
    inputSchema: GenerateAdminReportInputSchema,
    outputSchema: GenerateAdminReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
