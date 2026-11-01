
import { ai } from '@/ai/genkit';
import { AnalyzeSpokenAudioInputSchema, AnalyzeSpokenAudioOutputSchema, type AnalyzeSpokenAudioInput, type AnalyzeSpokenAudioOutput } from '@/lib/types';

export async function analyzeSpokenAudio(input: AnalyzeSpokenAudioInput): Promise<AnalyzeSpokenAudioOutput> {
  return analyzeSpokenAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpokenAudioPrompt',
  input: { schema: AnalyzeSpokenAudioInputSchema },
  output: { schema: AnalyzeSpokenAudioOutputSchema },
  prompt: `
    You are a supportive, high-end Senior Language Teacher and professional pronunciation coach. 
    Using your advanced multimodal skills, perform a DIRECT AUDIO ANALYSIS on the {{targetLanguage}} recording from your student, {{userName}}.
    
    Audio: {{media url=audioDataUri}}

    **IMPORTANT: YOU MUST PROVIDE A FULL TRANSCRIPTION IN THE \`transcribedText\` FIELD.** Focus the rest of your analysis on the sonic and linguistic qualities of the student's delivery.

    **Evaluation Tasks (Direct Student Feedback):**
    1. **Transcription**: Accurately transcribe EXACTLY what {{userName}} said.
    2. **Fluency (0-100)**: Evaluate rhythm, intonation, and pacing. (80+: Fluid; 60-70: Frequent pauses; <50: Disjointed).
    3. **Clarity (0-100)**: Evaluate the precision of pronunciations. (90+: Crystal clear; 60-70: Understandable but accented; <50: Difficult to decipher).
    4. **Vocabulary (0-100)**: Evaluate the richness and variety of words used. (90+: Sophisticated; 70-80: Standard but accurate; <60: Repetitive or basic).
    5. **Grammar (0-100)**: Evaluate the structural accuracy of the content. (95+: Perfect; 70-80: Minor slips; <60: Multiple tense/structure errors).
    6. **Fillers**: Identify and count filler words (e.g., "um", "ah", "like").
    7. **Pronunciation**: Identify specific words that {{userName}} mispronounced and provide phonetic suggestions.
    8. **Enhancements**: Identify potential grammar corrections or vocabulary improvements. For each correction or suggestion, you MUST assign a **severity**:
       - 'error': Severe grammatical or structural mistakes.
       - 'warning': Minor slips, slightly awkward phrasing, or slightly incorrect word choice.
       - 'info': Purely stylistic suggestions for more natural or advanced expression.
    9. **Score Explanation (The Review)**: Address {{userName}} directly (e.g., "Hey {{userName}}, I listened to your recording..."). Provide a detailed, supportive but firm review of their performance. Highlight specific mistakes, explain WHY they were mistakes, and give concrete suggestions on how to improve. Sound like a real teacher giving private feedback.

    **SCORING RESOLUTION**: DO NOT DEFAULT TO 50. Use the entire 0-100 scale based on the rubric above. Be an honest and helpful mentor.

    Return your results as a strictly structured JSON matching the output schema. Maintain a professional educational tone throughout.`,
});

const analyzeSpokenAudioFlow = ai.defineFlow(
  {
    name: 'analyzeSpokenAudio',
    inputSchema: AnalyzeSpokenAudioInputSchema,
    outputSchema: AnalyzeSpokenAudioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
        throw new Error("AI failed to generate audio analysis.");
    }

    return output;
  }
);
