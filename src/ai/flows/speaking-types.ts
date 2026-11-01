import { z } from 'zod';

export const GenerateSpeakingPracticeInputSchema = z.object({
  practiceType: z.string(),
  topic: z.string().optional(),
  voice: z.string(),
  accent: z.string(),
  chatHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })),
  userAudio: z.string().optional(),
});

export type GenerateSpeakingPracticeInput = z.infer<typeof GenerateSpeakingPracticeInputSchema>;

export const TurnAnalysisSchema = z.object({
  transcribedText: z.string().optional(),
  fluencyScore: z.number().optional(),
  clarityScore: z.number().optional(),
  vocabularyScore: z.number().optional(),
  grammarScore: z.number().optional(),
  fillerCount: z.number().optional(),
  mispronunciations: z.array(z.object({
    word: z.string(),
    phoneticSuggestion: z.string()
  })).optional(),
  enhancements: z.array(z.object({
    text: z.string(),
    suggestion: z.string(),
    severity: z.enum(['error', 'warning', 'info'])
  })).optional()
});

export type TurnAnalysis = z.infer<typeof TurnAnalysisSchema>;

export const GenerateSpeakingOutputSchema = z.object({
  spokenResponse: z.string().optional(),
  displayResponse: z.string(),
  audioDataUri: z.string(),
  newSpeaker: z.string().optional(),
  turnAnalysis: TurnAnalysisSchema.optional()
});

export type GenerateSpeakingPracticeOutput = z.infer<typeof GenerateSpeakingOutputSchema>;

export const SpeakingReportOutputSchema = z.object({
    fluency: z.object({
        score: z.number().min(0).max(100).default(0),
        pros: z.array(z.string()).default([]),
        cons: z.array(z.string()).default([]),
        explanation: z.string().default(""),
    }),
    grammar: z.object({
        score: z.number().min(0).max(100).default(0),
        pros: z.array(z.string()).default([]),
        cons: z.array(z.string()).default([]),
        explanation: z.string().default(""),
    }),
    confidence: z.object({
        score: z.number().min(0).max(100).default(0),
        pros: z.array(z.string()).default([]),
        cons: z.array(z.string()).default([]),
        explanation: z.string().default(""),
    }),
    teacherReview: z.object({
        summary: z.string().default("No summary available."),
        wasVague: z.boolean().default(false),
        wasToThePoint: z.boolean().default(false),
        detailedFeedback: z.string().default(""),
    }).optional(),
    parametersUsed: z.string().default("Standard IELTS/TOEFL metrics."),
    overallSummary: z.string().default("Session completed."),
});

export type SpeakingReportOutput = z.infer<typeof SpeakingReportOutputSchema>;
