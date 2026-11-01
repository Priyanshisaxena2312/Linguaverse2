import { conversationalAi } from '@/ai/genkit';
import { z } from 'zod';
import { SpeakingReportOutputSchema } from './speaking-types';
import type { SpeakingReportOutput } from './speaking-types';

export const generateSpeakingReportPrompt = conversationalAi.definePrompt({
    name: 'generateSpeakingReportPrompt',
    input: {
        schema: z.object({
            chatHistory: z.array(z.object({
                role: z.string(),
                content: z.string(),
            })),
            topic: z.string().optional(),
            practiceType: z.string(),
            allTurnAnalyses: z.string().optional()
        })
    },
    output: { schema: SpeakingReportOutputSchema },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
    You are an expert English Language Coach specializing in IELTS and TOEFL preparation.
    You have just observed a student in a "{{practiceType}}" session{{#if topic}} focused on "{{topic}}"{{/if}}.
    
    **CRITICAL EVALUATION RULE:** 
    1. If the audio transcription or history shows [silence] or long gaps, penalize the **Fluency** score heavily.
    2. A 2-second pause is a significant break. Count these as negative points.
    
    **CONVERSATION TRANSCRIPT:**
    {{#each chatHistory}}
    {{role}}: {{content}}
    {{/each}}

    {{#if allTurnAnalyses}}
    **DETAILED TURN ANALYSES:**
    {{allTurnAnalyses}}
    {{/if}}
    
    3. **Linguistic Extraction**: 
        - Identify at least 3-5 specific grammar mistakes or awkward phrasings from the student's speech.
        - Provide the correct version and a brief explanation for each.
        - Identify 2-3 "Premium Vocabulary" words the student used correctly, or suggest better alternatives for simple words used.
    4. **Teacher Review**: 
        - Sound like a Senior Pronunciation Coach.
        - Address if the student was "vague" or "to-the-point" in their answers.
        - Analyze how they answered the AI's questions. 
        - Provide a final summary including the linguistic insights.
    
    **PARAMETERS TO EXPLAIN:**
    Explain the scoring based on pronunciation precise, grammar trend, and filler frequency.
    
    Return as structured JSON matching SpeakingReportOutputSchema.
    `,
});

export const generateSpeakingReportFlow = conversationalAi.defineFlow(
    {
        name: 'generateSpeakingReportFlow',
        inputSchema: z.object({
            chatHistory: z.array(z.object({ role: z.string(), content: z.string() })),
            topic: z.string().optional(),
            practiceType: z.string(),
            allTurnAnalyses: z.string().optional()
        }),
        outputSchema: SpeakingReportOutputSchema,
    },
    async (input) => {
        const { output } = await generateSpeakingReportPrompt(input as any);
        if (!output) throw new Error("Failed to generate report.");
        return output;
    }
);
