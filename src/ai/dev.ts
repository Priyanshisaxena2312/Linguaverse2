
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-journal-entry.ts';
import '@/ai/flows/generate-journal-from-audio.ts';
import '@/ai/flows/analyze-journal-entry.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/refine-journal-entry.ts';
import '@/ai/flows/generate-insights.ts';
import '@/ai/flows/generate-chat-response.ts';
import '@/ai/flows/generate-journal-chat-response.ts';
import '@/ai/flows/generate-log-report.ts';
import '@/ai/flows/generate-iteration.ts';
import '@/ai/flows/generate-admin-report.ts';
import '@/ai/flows/generate-student-report.ts';
import '@/ai/flows/generate-class-performance-report.ts';
import '@/ai/flows/generate-tags.ts';
import '@/ai/flows/generate-tasks.ts';
import '@/ai/flows/generate-embedding.ts';
import '@/ai/flows/analyze-text-for-language.ts';
import '@/ai/flows/generate-pronunciation.ts';
import '@/ai/flows/analyze-spoken-audio.ts';
import '@/ai/flows/generate-practice-chat-response.ts';
import '@/ai/flows/generate-practice-quiz.ts';
import '@/ai/flows/define-word.ts';
import '@/ai/flows/compare-words.ts';
import '@/ai/flows/generate-teacher-feedback.ts';
import '@/ai/flows/generate-speaking-practice-response.ts';

