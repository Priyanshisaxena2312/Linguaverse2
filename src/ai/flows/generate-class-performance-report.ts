
'use server';

/**
 * @fileOverview A Genkit flow to generate a detailed class performance report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GrammarMistakeSummarySchema = z.object({
  category: z.string(),
  count: z.number(),
  studentCount: z.number(),
});

const StudentParticipationSchema = z.object({
  assignment_id: z.string(),
  assignment_title: z.string(),
  submission_count: z.number(),
});

const GenerateClassPerformanceReportInputSchema = z.object({
  className: z.string(),
  totalStudents: z.number(),
  totalSubmissions: z.number(),
  avgGrammarScore: z.number().nullable(),
  grammarHotspots: z.array(GrammarMistakeSummarySchema),
  studentParticipation: z.array(StudentParticipationSchema),
});
export type GenerateClassPerformanceReportInput = z.infer<typeof GenerateClassPerformanceReportInputSchema>;

const GenerateClassPerformanceReportOutputSchema = z.object({
  report: z.string().describe('The full, comprehensive class performance report in Markdown format.'),
});
export type GenerateClassPerformanceReportOutput = z.infer<typeof GenerateClassPerformanceReportOutputSchema>;


export async function generateClassPerformanceReport(input: GenerateClassPerformanceReportInput): Promise<GenerateClassPerformanceReportOutput> {
  return generateClassPerformanceReportFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateClassPerformanceReportPrompt',
  input: { schema: GenerateClassPerformanceReportInputSchema },
  output: { schema: GenerateClassPerformanceReportOutputSchema },
  prompt: `You are a Senior Data Analyst and Educational Strategist specializing in language learning. Your task is to write a comprehensive, professional, and insightful performance report for a teacher based on the provided class data.

**Class:** {{{className}}}
**Total Students:** {{{totalStudents}}}
**Data Summary:**
- Average Grammar Score (All Time): {{{avgGrammarScore}}}
- Total Submissions (All Time): {{{totalSubmissions}}}

---
**Report Sections:**

### **1. Executive Summary**
   - Provide a high-level overview of the class's current standing.
   - Mention overall engagement and academic performance in brief. What is the big picture?

### **2. Academic Performance Analysis**
   - **Grammar Score:** Discuss the average grammar score of {{{avgGrammarScore}}}. Is this score strong (>85), average (70-85), or an area needing focus (<70)? What does this indicate about the class's writing proficiency?
   - **Grammar Hotspots:** Analyze the most common mistakes.
     - Data: {{#each grammarHotspots}}'{{category}}' ({{count}} times by {{studentCount}} students){{/each}}
     - Identify the top 2-3 most frequent error categories. Why might these specific errors be common? Are they related (e.g., verb tense and subject-verb agreement)?

### **3. Student Engagement & Participation**
   - **Submission Rates:** Analyze the participation data.
     - Data: {{#each studentParticipation}}'{{assignment_title}}' ({{submission_count}}/{{totalStudents}} submitted){{/each}}
   - Are there assignments with notably high or low submission rates? What might this imply about student interest or assignment difficulty?
   - Calculate and discuss the overall submission rate across all listed assignments.

### **4. Strategic Recommendations for the Teacher**
   - Based on *all* the data, provide 3-4 actionable, concrete recommendations.
   - **Link recommendations directly to the data.**
   - **Good Example:** "Given that 'Prepositions' are the most common error category, consider a 15-minute workshop focused on prepositional phrases of time and place."
   - **Bad Example:** "Do more grammar exercises."
   - Suggest strategies to address both the academic weaknesses (grammar hotspots) and any engagement issues observed.

### **5. Concluding Remarks**
   - End with a brief, encouraging summary and suggest a focus for the upcoming weeks.

---
Generate the full report in well-structured Markdown.`,
});

const generateClassPerformanceReportFlow = ai.defineFlow(
  {
    name: 'generateClassPerformanceReportFlow',
    inputSchema: GenerateClassPerformanceReportInputSchema,
    outputSchema: GenerateClassPerformanceReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
