
'use server';

/**
 * @fileOverview A Genkit flow to generate a detailed performance report for a single student.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EntryAnalysisSummarySchema = z.object({
    grammaticalAccuracy: z.number().optional(),
    vocabularyRichness: z.number().optional(),
    fluencyAndCohesion: z.number().optional(),
    sentiment: z.number().optional(),
});

const MistakeSummarySchema = z.object({
    category: z.string(),
    count: z.number(),
});

const GenerateStudentReportInputSchema = z.object({
  studentName: z.string(),
  totalEntries: z.number(),
  dateRange: z.object({ from: z.string(), to: z.string() }),
  allTimeAvgGrammarScore: z.number().nullable(),
  periodAvgScores: EntryAnalysisSummarySchema,
  topMistakes: z.array(MistakeSummarySchema),
});
export type GenerateStudentReportInput = z.infer<typeof GenerateStudentReportInputSchema>;

const GenerateStudentReportOutputSchema = z.object({
  report: z.string().describe('The full, comprehensive student performance report in Markdown format.'),
});
export type GenerateStudentReportOutput = z.infer<typeof GenerateStudentReportOutputSchema>;


export async function generateStudentReport(input: GenerateStudentReportInput): Promise<GenerateStudentReportOutput> {
  return generateStudentReportFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateStudentReportPrompt',
  input: { schema: GenerateStudentReportInputSchema },
  output: { schema: GenerateStudentReportOutputSchema },
  prompt: `You are an expert educational analyst writing a detailed performance report for a student named **{{{studentName}}}**. The report is for their teacher.

**Student Data Overview:**
- **Student Name:** {{{studentName}}}
- **Total Entries (All Time):** {{{totalEntries}}}
- **All-Time Average Grammar Score:** {{{allTimeAvgGrammarScore}}}
- **Reporting Period:** {{{dateRange.from}}} to {{{dateRange.to}}}

---
**Structure your report as follows:**

### **1. Executive Summary**
   - Start with a high-level summary of {{{studentName}}}'s performance during this period. Mention their key strengths and areas for improvement.

### **2. Performance Analysis ({{dateRange.from}}} - {{{dateRange.to}}})**
   - **Grammar & Writing Proficiency:**
     - Avg Grammar Score: {{{periodAvgScores.grammaticalAccuracy}}}
     - Avg Vocabulary Score: {{{periodAvgScores.vocabularyRichness}}}
     - Avg Fluency Score: {{{periodAvgScores.fluencyAndCohesion}}}
     - Discuss these scores. Is the student stronger in one area than another? Compare their period grammar score to their all-time average if available.
   - **Common Mistakes in this Period:**
     - Data: {{#each topMistakes}}'{{category}}' ({{count}} times){{/each}}
     - Identify the top 1-2 most frequent error categories. What pattern do these mistakes suggest? (e.g., "A high frequency of 'Tense' errors suggests difficulty with verb conjugation.")
   - **Emotional Tone (Sentiment):**
     - Avg Sentiment Score: {{{periodAvgScores.sentiment}}}
     - Briefly describe what this score indicates about the student's general sentiment in their writing during this period (e.g., "A score around 75 suggests predominantly positive and optimistic writing.").

### **3. Strengths & Opportunities**
   - **Key Strengths:** Based on the data, what is {{{studentName}}} doing well? (e.g., "High vocabulary score indicates a strong and varied lexicon.")
   - **Opportunities for Growth:** What specific areas offer the most potential for improvement? (e.g., "Focusing on subject-verb agreement could significantly boost their grammar score.")

### **4. Actionable Recommendations for the Teacher**
   - Provide 2-3 specific, actionable recommendations.
   - **Good Example:** "Recommend {{{studentName}}} use the 'Practice Arena' feature for 'Tense' and 'Article Usage' quizzes."
   - **Another Good Example:** "During the next feedback session, focus on explaining the correct use of past participles, as this seems to be a recurring issue."

---
Generate the full report in professional, well-structured Markdown.`,
});

const generateStudentReportFlow = ai.defineFlow(
  {
    name: 'generateStudentReportFlow',
    inputSchema: GenerateStudentReportInputSchema,
    outputSchema: GenerateStudentReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
