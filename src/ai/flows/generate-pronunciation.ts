

'use server';

/**
 * @fileOverview A Genkit flow to generate audio pronunciation for a word.
 * This flow is kept for potential future use with higher quality AI voices,
 * but the main app now uses browser TTS for speed and cost.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// @ts-ignore
import wav from 'wav';

const GeneratePronunciationInputSchema = z.object({
  word: z.string().describe('The word to generate pronunciation for.'),
  language: z.string().describe('The language of the word (e.g., English, Spanish).'),
});
export type GeneratePronunciationInput = z.infer<typeof GeneratePronunciationInputSchema>;

const GeneratePronunciationOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type GeneratePronunciationOutput = z.infer<typeof GeneratePronunciationOutputSchema>;


export async function generatePronunciation(input: GeneratePronunciationInput): Promise<GeneratePronunciationOutput> {
  return generatePronunciationFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d: any) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generatePronunciationFlow = ai.defineFlow(
  {
    name: 'generatePronunciationFlow',
    inputSchema: GeneratePronunciationInputSchema,
    outputSchema: GeneratePronunciationOutputSchema,
  },
  async ({ word, language }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: `Please pronounce the following ${language} word: ${word}`,
    });

    if (!media) {
      throw new Error('No audio media was returned from the TTS model.');
    }

    // The Gemini TTS API returns raw PCM data in a data URI. We need to convert it to WAV.
    // Format is 'data:audio/x-raw-int16;rate=24000,<base64_pcm>'
    if (media.url.startsWith('data:audio/x-raw')) {
      const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
      const wavBase64 = await toWav(audioBuffer);
      return {
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };
    }

    // If it's already a WAV data URI, just return it (less common).
    if (media.url.startsWith('data:audio/wav')) {
      return {
        audioDataUri: media.url,
      };
    }

    throw new Error(`Unexpected audio format received: ${media.contentType || 'unknown'}`);
  }
);
