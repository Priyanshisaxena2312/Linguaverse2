import { conversationalAi, ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateSpeakingPracticeInputSchema, GenerateSpeakingOutputSchema } from './speaking-types';

// @ts-expect-error - no types exist for 'wav'
import wav from 'wav';

export async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({ channels: 1, sampleRate: 24000, bitDepth: 16 });
        const bufs: any[] = [];
        writer.on('error', reject);
        writer.on('data', (d: any) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
        writer.write(pcmData);
        writer.end();
    });
}

export const speakingPrompt = conversationalAi.definePrompt({
    name: 'generateNewSpeakingPrompt',
    input: {
        schema: GenerateSpeakingPracticeInputSchema.extend({
            isGroupDiscussion: z.boolean().optional(),
            isDebate: z.boolean().optional(),
            isJamSession: z.boolean().optional(),
        })
    },
    output: {
        schema: z.object({
            transcription: z.string().describe("The exact transcription of the user's audio input."),
            response: z.string().describe("The AI's next response in the conversation."),
            speakerName: z.string().optional().describe("If group discussion, the name of the AI who just spoke.")
        })
    },
    model: 'googleai/gemini-2.5-flash',
    prompt: `You are a live role-playing partner (or panel of partners). 
    
    **PRACTICE TYPE:** {{{practiceType}}}
    {{#if topic}}**TOPIC:** {{{topic}}}{{/if}}
    **ACCENT PREFERENCE:** {{{accent}}}
    
    {{#if isGroupDiscussion}}
    You are acting as a panel of 4 interviewers (AI 1, AI 2, AI 3, AI 4). Rotation: rotate the speaker field naturally.
    {{else if isDebate}}
    You are a skilled debater. Challenge the user's arguments logically.
    {{else if isJamSession}}
    You have limited time. Keep your responses extremely brief!
    {{else}}
    You are a friendly conversation partner.
    {{/if}}
    
    **CONVERSATION HISTORY:**
    {{#each chatHistory}}
    {{role}}: {{content}}
    {{/each}}
    
    {{#if userAudio}}
    **USER AUDIO INPUT:** {{media url=userAudio}}
    **INSTRUCTION:** 
    1. Listen carefully to the user's audio.
    2. Transcribe exactly what they said into the 'transcription' field.
    3. Generate your response based on the transcription and the history.
    {{/if}}
    
    Now, generate your transcription (if audio provided) and your next response. Do NOT include actions in parentheses.
    `,
});

export const generateNewSpeakingFlow = conversationalAi.defineFlow(
    {
        name: 'generateNewSpeakingFlow',
        inputSchema: GenerateSpeakingPracticeInputSchema,
        outputSchema: GenerateSpeakingOutputSchema,
    },
    async (input) => {
        try {
            console.log("Starting Speaking Flow with audio analysis...");
            const promptInput = {
                ...input,
                isGroupDiscussion: input.practiceType === 'Group Discussion',
                isDebate: input.practiceType === 'Debate',
                isJamSession: input.practiceType === 'Jam Session',
                userAudio: input.userAudio
            };

            // Branch A: AI Reasoning (Next Response)
            // Branch B: Audio Analysis (Multimodal Analysis)
            const reasoningPromise = speakingPrompt(promptInput as any);
            
            let analysisPromise = Promise.resolve({ output: undefined });
            if (input.userAudio) {
                const { analyzeSpokenAudio } = require('./analyze-spoken-audio');
                analysisPromise = analyzeSpokenAudio({
                    audioDataUri: input.userAudio,
                    userName: 'Student', // Could be dynamic
                    targetLanguage: 'English'
                }).then((res: any) => ({ output: res }));
            }

            const [{ output: reasoningOutput }, { output: analysisOutput }] = await Promise.all([
                reasoningPromise,
                analysisPromise as Promise<{ output: any }>
            ]);

            if (!reasoningOutput?.response) {
                throw new Error("No response generated.");
            }

            const transcription = reasoningOutput.transcription || '(Audio message transcribed)';
            const displayResponse = reasoningOutput.response;
            const spokenText = reasoningOutput.response.replace(/ *\([^)]*\) */g, ' ').trim();
            let ttsVoice = input.voice;

        let media;
        try {
            const result = await conversationalAi.generate({
                model: 'googleai/gemini-2.5-flash',
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoice } },
                    },
                },
                prompt: spokenText,
            });
            media = result.media;
        } catch (e) {
            console.error("TTS generation failed. Falling back...", e);
            const result = await conversationalAi.generate({
                model: 'googleai/gemini-2.5-flash',
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoice } },
                    },
                },
                prompt: spokenText,
            });
            media = result.media;
        }

        if (!media?.url) {
            throw new Error('TTS model did not return audio media.');
        }

        // Convert raw PCM to playable WAV
        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);
        const audioDataUri = 'data:audio/wav;base64,' + wavBase64;

        return {
            spokenResponse: transcription,
            displayResponse: reasoningOutput.speakerName ? `[${reasoningOutput.speakerName}] ${displayResponse}` : displayResponse,
            audioDataUri,
            newSpeaker: reasoningOutput.speakerName,
            turnAnalysis: analysisOutput ? {
                transcribedText: (analysisOutput as any).transcribedText || transcription,
                fluencyScore: (analysisOutput as any).fluencyScore || 0,
                clarityScore: (analysisOutput as any).clarityScore || 0,
                vocabularyScore: (analysisOutput as any).vocabularyScore || 0,
                grammarScore: (analysisOutput as any).grammarScore || 0,
                fillerCount: (analysisOutput as any).fillerCount || 0,
                mispronunciations: (analysisOutput as any).mispronunciations || [],
                enhancements: (analysisOutput as any).enhancements || []
            } : undefined
        };
    } catch (err) {
        console.error("Error in speaking flow:", err);
        throw err;
    }
}
);
