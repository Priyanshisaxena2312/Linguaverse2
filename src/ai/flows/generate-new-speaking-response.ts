'use server';

import type { GenerateSpeakingPracticeInput, GenerateSpeakingPracticeOutput, SpeakingReportOutput } from './speaking-types';

export async function generateSpeakingPracticeResponse(input: GenerateSpeakingPracticeInput): Promise<GenerateSpeakingPracticeOutput> {
    const { generateNewSpeakingFlow } = await import('./speaking-logic');
    return generateNewSpeakingFlow(input);
}

export async function generateSpeakingReportAction(input: { chatHistory: { role: string, content: string }[], topic?: string, practiceType: string, allTurnAnalyses?: any[] }): Promise<SpeakingReportOutput | { error: string }> {
    try {
        console.log("Generating report with turn analyses...", input.allTurnAnalyses?.length || 0);
        const { generateSpeakingReportFlow } = await import('./generate-speaking-report');
        const report = await generateSpeakingReportFlow({
            ...input,
            allTurnAnalyses: input.allTurnAnalyses ? JSON.stringify(input.allTurnAnalyses) : undefined
        });
        return report;
    } catch (e) {
        console.error("Report Generation Error:", e);
        return { error: (e as Error).message };
    }
}
