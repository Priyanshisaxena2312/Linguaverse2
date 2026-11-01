import type { Profile, JournalEntry, TodoTask, TodoList, HardWord } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

export { DEMO_COOKIE_NAME, DEMO_USER_ID } from '@/lib/constants';
import { DEMO_USER_ID } from '@/lib/constants';

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  app_metadata: { provider: 'demo', providers: ['demo'] },
  user_metadata: {
    full_name: 'Priyanshi Saxena',
    email: 'priyanshisaxenapna@gmail.com',
  },
  aud: 'authenticated',
  confirmation_sent_at: '2026-01-01T00:00:00Z',
  recovery_sent_at: '2026-01-01T00:00:00Z',
  email_change_sent_at: '2026-01-01T00:00:00Z',
  new_email: '',
  invited_at: '2026-01-01T00:00:00Z',
  action_link: '',
  email: 'priyanshisaxenapna@gmail.com',
  phone: '',
  created_at: '2026-01-01T00:00:00Z',
  confirmed_at: '2026-01-01T00:00:00Z',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  phone_confirmed_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: '2026-11-01T12:00:00Z',
  role: 'authenticated',
  updated_at: '2026-11-01T12:00:00Z',
  identities: [],
  is_anonymous: false,
};

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  full_name: 'Priyanshi Saxena',
  contact_mail: 'priyanshisaxenapna@gmail.com',
  plan: 'free',
  db_plan: 'free',
  role: 'user',
  profile_setup_complete: true,
  ai_analysis_enabled: true,
  current_streak: 5,
  highest_streak: 14,
  theme_preference: null,
};

const createDocJson = (text: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }],
    },
  ],
});

export const DEMO_ENTRIES: JournalEntry[] = [
  {
    id: 'demo-entry-1',
    user_id: DEMO_USER_ID,
    title: 'Reflections on Conversational AI & Clear Communication',
    content: createDocJson(
      'Today I practiced articulating my thoughts on technical system design out loud. I realized that pausing before answering complex questions helps me structure my arguments far more effectively, eliminating unnecessary filler words like "um" and "you know".'
    ),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    tags: ['Reflection', 'Speaking', 'Confidence'],
    source: 'manual',
    language_analysis: null,
    iterations: [],
    analysis: {
      personal: {
        sentiment: {
          positive: 85,
          negative: 5,
          neutral: 10,
          overallScore: 88,
        },
        mood: {
          breakdown: [
            { mood: 'Confident', percentage: 60 },
            { mood: 'Focused', percentage: 25 },
            { mood: 'Calm', percentage: 15 },
          ],
          overallScore: 85,
        },
        productivity: 92,
        creativity: 80,
      },
      language: {
        grammaticalAccuracy: 95,
        vocabularyRichness: 88,
        fluencyAndCohesion: 90,
      },
    },
  },
  {
    id: 'demo-entry-2',
    user_id: DEMO_USER_ID,
    title: 'Practicing Subtle Word Distinctions (Affect vs Effect)',
    content: createDocJson(
      'I often hesitate between using "affect" and "effect" in written reports. "Affect" is usually a verb meaning to influence something, while "effect" is typically a noun denoting the result. Mastering these nuances makes my writing sound significantly more polished.'
    ),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // yesterday
    tags: ['Vocabulary', 'Writing', 'Grammar'],
    source: 'manual',
    language_analysis: null,
    iterations: [],
    analysis: {
      personal: {
        sentiment: {
          positive: 78,
          negative: 8,
          neutral: 14,
          overallScore: 82,
        },
        mood: {
          breakdown: [
            { mood: 'Curious', percentage: 50 },
            { mood: 'Analytical', percentage: 35 },
            { mood: 'Motivated', percentage: 15 },
          ],
          overallScore: 80,
        },
        productivity: 85,
        creativity: 75,
      },
      language: {
        grammaticalAccuracy: 92,
        vocabularyRichness: 86,
        fluencyAndCohesion: 88,
      },
    },
  },
  {
    id: 'demo-entry-3',
    user_id: DEMO_USER_ID,
    title: 'Daily Evening Synthesis & Mindful Reset',
    content: createDocJson(
      'Wrapping up today’s coding sprint. We removed redundant legacy dependencies and streamlined the Next.js App Router setup. Everything feels much lighter and faster now.'
    ),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(), // 2 days ago
    tags: ['Productivity', 'Engineering', 'Journal'],
    source: 'manual',
    language_analysis: null,
    iterations: [],
    analysis: {
      personal: {
        sentiment: {
          positive: 90,
          negative: 2,
          neutral: 8,
          overallScore: 90,
        },
        mood: {
          breakdown: [
            { mood: 'Accomplished', percentage: 70 },
            { mood: 'Energized', percentage: 30 },
          ],
          overallScore: 90,
        },
        productivity: 95,
        creativity: 85,
      },
      language: {
        grammaticalAccuracy: 96,
        vocabularyRichness: 85,
        fluencyAndCohesion: 89,
      },
    },
  },
];

export const DEMO_TODO_TASKS: TodoTask[] = [
  {
    id: 'demo-task-1',
    user_id: DEMO_USER_ID,
    list_id: 'demo-list-1',
    content: 'Practice 5-minute duplex voice conversation using AI coach',
    priority: 'high',
    status: 'todo',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    user_id: DEMO_USER_ID,
    list_id: 'demo-list-1',
    content: 'Review 3 vocabulary flashcards in the Practice Arena',
    priority: 'medium',
    status: 'todo',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-task-3',
    user_id: DEMO_USER_ID,
    list_id: 'demo-list-1',
    content: 'Read through the grammar hotspot analysis for common preposition errors',
    priority: 'low',
    status: 'todo',
    created_at: new Date().toISOString(),
  },
];

export const DEMO_TODO_LISTS: TodoList[] = [
  {
    id: 'demo-list-1',
    user_id: DEMO_USER_ID,
    name: 'Weekly Communication Goals',
    created_at: new Date().toISOString(),
    tasks: DEMO_TODO_TASKS,
  },
];

export const DEMO_HARD_WORDS: HardWord[] = [
  {
    id: 'demo-word-1',
    user_id: DEMO_USER_ID,
    word: 'Articulate',
    meaning: 'Having or showing the ability to speak fluently and coherently.',
    explanation: 'From Latin articulatus, meaning divided into distinct parts or clear speech.',
    use_case: 'She gave an articulate and persuasive presentation.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-word-2',
    user_id: DEMO_USER_ID,
    word: 'Nuance',
    meaning: 'A subtle difference in or shade of meaning, expression, or sound.',
    explanation: 'Used when pointing out fine distinctions that change interpretation.',
    use_case: 'The nuanced debate highlighted the subtleties of the language.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-word-3',
    user_id: DEMO_USER_ID,
    word: 'Eloquent',
    meaning: 'Fluent or persuasive in speaking or writing.',
    explanation: 'Often describes speech that conveys strong feeling with great style.',
    use_case: 'His eloquent remarks resonated deeply with the listeners.',
    created_at: new Date().toISOString(),
  },
];
