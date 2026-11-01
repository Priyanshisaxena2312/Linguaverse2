
import { z } from 'zod';

// --- TYPE DEFINITIONS for Web Speech API ---
// This is necessary because the standard TypeScript library doesn't include these browser-specific APIs.

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

// FIX: Declare the constructor type separately
export interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}


// FIX: Declare the properties on the global Window interface
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}


// --- Global App Settings ---
export const AppSettingsSchema = z.object({
  id: z.number(),
  ai_writing_enabled: z.boolean(),
  ai_writing_disabled_classes: z.array(z.string()).default([]),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;


// --- Schema for analyze-journal-entry.ts ---
export const AnalyzeJournalEntryInputSchema = z.object({
  journalContent: z.string(),
  analysisType: z.enum(['personal', 'language']),
});
export type AnalyzeJournalEntryInput = z.infer<typeof AnalyzeJournalEntryInputSchema>;

const PersonalAnalysisSchema = z.object({
  sentiment: z.object({
    positive: z.number().describe('Sentiment score for positive aspects, from 0 to 100.'),
    negative: z.number().describe('Sentiment score for negative aspects, from 0 to 100.'),
    neutral: z.number().describe('Sentiment score for neutral aspects, from 0 to 100.'),
    overallScore: z.number().describe('A single sentiment score from 0 (very negative) to 100 (very positive).'),
  }).describe('The sentiment analysis of the entry.'),
  mood: z.object({
    breakdown: z.array(z.object({
      mood: z.string().describe('The identified mood (e.g., Joy, Sadness, Stressed).'),
      percentage: z.number().describe('The percentage of this mood in the entry.'),
    })).describe('A breakdown of the top 4 moods found in the entry.'),
    overallScore: z.number().describe('An overall mood score from 0 (very negative) to 100 (very positive).'),
  }).describe('The mood analysis of the entry.'),
  productivity: z.number().describe('A score from 0 to 100 indicating the level of productivity mentioned.'),
  creativity: z.number().describe('A score from 0 to 100 indicating the level of creativity mentioned.'),
});

const LanguageAnalysisSchema = z.object({
  grammaticalAccuracy: z.number().describe('Score from 0 to 100 for grammatical correctness.'),
  vocabularyRichness: z.number().describe('Score from 0 to 100 for vocabulary diversity and appropriateness.'),
  fluencyAndCohesion: z.number().describe('Score from 0 to 100 for how naturally the text flows.'),
});

export const AnalyzeJournalEntryOutputSchema = z.object({
  personal: PersonalAnalysisSchema.optional(),
  language: LanguageAnalysisSchema.optional(),
});
export type AnalyzeJournalEntryOutput = z.infer<typeof AnalyzeJournalEntryOutputSchema>;


// --- Schema for analyze-text-for-language.ts ---
export const GrammarCorrectionSchema = z.object({
  originalPhrase: z.string().describe("The full phrase or sentence containing the grammatical error."),
  correctedPhrase: z.string().describe("The corrected version of the phrase or sentence."),
  explanation: z.string().describe('A simple, clear explanation of the grammar rule and why the correction was made.'),
  mistakeCategory: z.string().describe("A specific category for the grammar mistake from the provided list (e.g., 'Subject-Verb Agreement', 'Tense', 'Article Usage')."),
  severity: z.enum(['error', 'warning', 'info']).describe('The severity level: error (Red), warning (Blue), or info (Suggestion).')
});
export type GrammarCorrection = z.infer<typeof GrammarCorrectionSchema>;

export const VocabularySuggestionSchema = z.object({
  originalWord: z.string().describe('The original word from the user\'s text that could be improved.'),
  suggestedWord: z.string().describe('The suggested, more advanced or appropriate replacement word.'),
  explanation: z.string().describe('An explanation of the new word\'s meaning and why it is a better choice.'),
  severity: z.enum(['error', 'warning', 'info']).describe('The severity level: error (Red), warning (Blue), or info (Suggestion).')
});
export type VocabularySuggestion = z.infer<typeof VocabularySuggestionSchema>;

export const AnalyzeTextForLanguageInputSchema = z.object({
  text: z.string().describe('The text to be analyzed for language improvements.'),
  targetLanguage: z.string().describe('The language the user is trying to write in (e.g., "English").'),
  proficiencyScore: z.number().optional().describe('The user\'s average proficiency score (0-100), used to tailor feedback complexity.'),
});
export type AnalyzeTextForLanguageInput = z.infer<typeof AnalyzeTextForLanguageInputSchema>;

export const AnalyzeTextForLanguageOutputSchema = z.object({
  grammarCorrections: z.array(GrammarCorrectionSchema).describe('A list of grammar corrections.'),
  vocabularyEnhancements: z.array(VocabularySuggestionSchema).describe('A list of vocabulary enhancement suggestions.'),
});
export type AnalyzeTextForLanguageOutput = z.infer<typeof AnalyzeTextForLanguageOutputSchema>;


// --- Schema for analyze-spoken-audio.ts ---
const PronunciationFeedbackSchema = z.object({
    word: z.string().describe("The word the user likely mispronounced."),
    suggestion: z.string().describe("The correct phonetic spelling or common word suggestion."),
    explanation: z.string().describe("A brief explanation of the pronunciation error."),
});

const FillerWordSchema = z.object({
    word: z.string().describe("The filler word that was detected (e.g., 'uhm', 'like')."),
    count: z.number().describe("The number of times this filler word was used."),
});

export const AnalyzeSpokenAudioInputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the audio recording. Must include MIME type and use Base64 encoding."),
  targetLanguage: z.string().describe("The language the user is attempting to speak."),
  userName: z.string().optional().describe("The name of the user to address in the feedback."),
});
export type AnalyzeSpokenAudioInput = z.infer<typeof AnalyzeSpokenAudioInputSchema>;


export const AnalyzeSpokenAudioOutputSchema = z.object({
    transcribedText: z.string().describe("The full transcription of the user's speech."),
    fluencyScore: z.number().describe("A score from 0-100 representing the speaker's fluency (rhythm, intonation, pacing)."),
    clarityScore: z.number().describe("A score from 0-100 representing the clarity of the speaker's pronunciation."),
    vocabularyScore: z.number().describe("A score from 0-100 representing the richness and appropriateness of the vocabulary used."),
    grammarScore: z.number().describe("A score from 0-100 representing the grammatical accuracy of the spoken content."),
    fillerWords: z.array(FillerWordSchema).describe("An array of filler words identified and their counts."),
    pronunciationFeedback: z.array(PronunciationFeedbackSchema).describe("A list of specific pronunciation corrections."),
    grammarCorrections: z.array(GrammarCorrectionSchema).describe('A list of grammar corrections identified from the transcribed text.'),
    vocabularyEnhancements: z.array(VocabularySuggestionSchema).describe('A list of vocabulary enhancement suggestions identified from the transcribed text.'),
    score_explanation: z.string().describe('A professional, teacher-like explanation of the AI-generated scores and overall speaking quality.'),
});
export type AnalyzeSpokenAudioOutput = z.infer<typeof AnalyzeSpokenAudioOutputSchema>;


// --- Schema for analyze-sentence-context.ts ---
export const AnalyzeSentenceContextInputSchema = z.object({
  sentence1: z.string().describe("The first sentence or phrase to compare."),
  sentence2: z.string().describe("The second sentence or phrase for comparison."),
});
export type AnalyzeSentenceContextInput = z.infer<typeof AnalyzeSentenceContextInputSchema>;

export const AnalyzeSentenceContextOutputSchema = z.object({
  contextClass: z.string().describe("A single word identifying the context (e.g., 'Formal', 'Casual', 'Sarcastic')."),
  useCase: z.string().describe("A brief explanation of where and when to use each sentence."),
  subtleDifferences: z.string().describe("Detailed breakdown of the small nuances, grammar, or tone between the two sentences."),
});
export type AnalyzeSentenceContextOutput = z.infer<typeof AnalyzeSentenceContextOutputSchema>;


// --- Schema for generate-practice-quiz.ts ---
export const CorrectionSchema = z.object({
    original: z.string(),
    suggestion: z.string(),
    explanation: z.string(),
});
export type Correction = z.infer<typeof CorrectionSchema>;

export const GeneratePracticeQuizInputSchema = z.object({
  corrections: z.array(CorrectionSchema).describe('A list of corrections, each with the original text, the suggested correction, and an explanation.'),
});
export type GeneratePracticeQuizInput = z.infer<typeof GeneratePracticeQuizInputSchema>;

export const QuizQuestionSchema = z.object({
    questionText: z.string().describe("A sentence with a blank '___' where the user needs to fill in the correct word or phrase."),
    options: z.array(z.string()).describe("An array of 4 options for the user to choose from."),
    correctAnswer: z.string().optional().describe("The primary correct option (Deprecated: use correctAnswers)."),
    correctAnswers: z.array(z.string()).describe("An array of one or more correct options from the 'options' array."),
    isMultiSelect: z.boolean().describe("Whether this question has multiple correct answers."),
    explanation: z.string().describe("The original explanation for this correction, to be shown to the user after they answer.")
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const GeneratePracticeQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of 3-5 quiz questions based on the provided corrections.'),
});
export type GeneratePracticeQuizOutput = z.infer<typeof GeneratePracticeQuizOutputSchema>;

// --- Schema for generate-teacher-feedback.ts ---
export const GenerateTeacherFeedbackInputSchema = z.object({
  teacherNotes: z.string().describe("The teacher's raw, unstructured notes, which could be bullet points or transcribed audio."),
  studentEntryText: z.string().describe("The original text of the student's journal entry for context."),
});
export type GenerateTeacherFeedbackInput = z.infer<typeof GenerateTeacherFeedbackInputSchema>;

export const GenerateTeacherFeedbackOutputSchema = z.object({
  structuredFeedback: z.string().describe('The well-formatted, easy-to-understand feedback for the student.'),
});
export type GenerateTeacherFeedbackOutput = z.infer<typeof GenerateTeacherFeedbackOutputSchema>;


// --- Schema for practice sessions ---
export type PracticeSession = {
  id: string;
  user_id: string;
  journal_entry_id: string;
  created_at: string;
  quiz_score: string | null;
  chat_history: { role: 'user' | 'assistant', content: string }[];
  performance_report: string;
};


// --- Other Flow Schemas ---
export const ChatBasedJournalingInputSchema = z.object({
  chatHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).describe('The full chat history, excluding the initial prompt.'),
  tone: z.string().optional().describe('The desired emotional tone for a personal entry (e.g., reflective, grateful).'),
  style: z.string().optional().describe('An optional stylistic preference for the entry.'),
  isDeveloper: z.boolean().optional().describe('If true, generate a structured, professional log instead of a personal journal entry.'),
});
export type ChatBasedJournalingInput = z.infer<typeof ChatBasedJournalingInputSchema>;

export const ChatBasedJournalingOutputSchema = z.object({
  title: z.string().describe('A concise and fitting title for the journal entry.'),
  journalEntry: z.string().describe('The fully generated journal entry. For developers, this is in Markdown format. For personal entries, this is in first-person prose. This must end with hashtags.'),
});
export type ChatBasedJournalingOutput = z.infer<typeof ChatBasedJournalingOutputSchema>;

// General App Types
export type Plan = 'free' | 'starter' | 'premium';

export type Theme = 'default' | 'classic' | 'modern' | 'monospace' | 'playful' | 'kalam';

export const THEMES: Record<Theme, { name: string }> = {
    default: { name: 'Default' },
    classic: { name: 'Classic' },
    modern: { name: 'Modern' },
    monospace: { name: 'Monospace' },
    playful: { name: 'Playful' },
    kalam: { name: 'Kalam Script' },
};

// All themes are available to all users now.
export const ALL_THEMES: Theme[] = ['default', 'classic', 'modern', 'monospace', 'playful', 'kalam'];


export type PageStyle = 'default' | 'ruled-paper' | 'parchment' | 'blueprint';

export const PAGE_STYLES: Record<PageStyle, { name: string }> = {
    default: { name: 'Default' },
    'ruled-paper': { name: 'Ruled Paper' },
    parchment: { name: 'Parchment' },
    blueprint: { name: 'Blueprint' },
};

export type LogIteration = {
  id: string;
  created_at: string;
  content: any;
  source: 'manual' | 'chat' | 'voice';
};

export type Assignment = {
    id: string;
    created_at: string;
    created_by: string;
    title: string;
    description: string | null;
    due_date: string | null;
    institution_name: string | null;
};

export type Submission = {
    id: string;
    created_at: string;
    assignment_id: string;
    journal_entry_id: string;
    user_id: string;
    assignments: { title: string } | null;
    journal_entries: { title: string } | null;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  content: any;
  source: 'manual' | 'chat' | 'voice';
  analysis: AnalyzeJournalEntryOutput | null;
  language_analysis: (AnalyzeTextForLanguageOutput & Partial<AnalyzeSpokenAudioOutput>) | null;
  theme?: Theme;
  page_style?: PageStyle;
  is_project_log?: boolean;
  iterations?: LogIteration[] | null;
  conversation?: { role: 'user' | 'assistant', content: string }[] | null;
  tags?: string[] | null;
  is_submitted?: boolean;
  submitted_at?: string | null;
  teacher_feedback?: string | null;
  assignment_id?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  speaking_analysis?: AnalyzeSpokenAudioOutput | null;
};

export type JournalEntryForCreate = Partial<Omit<JournalEntry, 'id' | 'created_at' | 'source' | 'user_id'>>;

export type Profile = {
  id: string;
  full_name: string | null;
  contact_mail: string | null;
  plan: Plan;
  db_plan: Plan; // The actual plan stored in the database, ignoring trial status
  role?: 'user';
  ai_analysis_enabled?: boolean;
  analysis_used?: number;
  chat_entries_used?: number;
  voice_entries_used?: number;
  summaries_used?: number;
  reports_used?: number;
  usage_reset_date?: string;
  highest_streak: number;
  current_streak: number;
  last_entry_date?: string | null;
  trial_started_at?: string | null;
  daily_questions_asked?: number;
  last_question_date?: string | null;
  institution_type?: 'school' | 'college' | null;
  institution_name?: string | null;
  age?: number | null;
  class_level?: string | null;
  stream?: string | null;
  year?: string | null;
  phone?: string | null;
  profile_setup_complete?: boolean;
  ai_improvement_enabled?: boolean;
  theme_preference?: Theme | null;
};

export type TodoTask = {
    id: string;
    list_id: string;
    user_id: string;
    created_at: string;
    content: string;
    status: 'todo' | 'inprogress' | 'done';
    priority: 'low' | 'medium' | 'high';
};

export type TodoList = {
    id: string;
    user_id: string;
    created_at: string;
    name: string;
    tasks: TodoTask[];
};

export type DictionaryWord = {
    id: string;
    user_id: string;
    created_at: string;
    word: string;
    original_context: string;
    corrected_context: string;
    explanation: string;
    type: 'written' | 'audio';
    pronunciation_url: string | null;
};

export type HardWord = {
    id: string;
    user_id: string;
    created_at: string;
    word: string;
    meaning: string;
    explanation: string;
    use_case: string;
};

export type ComparedWord = {
    id: string;
    user_id: string;
    created_at: string;
    word1: string;
    word2: string;
    comparison_details: string; // Encrypted JSON
};

export type ComparedSentence = {
    id: string;
    created_at: string;
    user_id: string;
    sentence_1: string;
    sentence_2: string;
    context_class: string;
    use_case: string;
    subtle_differences: string;
};


export type GrammarMistake = {
    id: string;
    created_at: string;
    user_id: string;
    journal_entry_id: string;
    mistake_category: string;
    explanation: string | null;
};
