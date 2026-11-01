# 🚀 Linguaverse Quickstart & Setup Links Guide

Everything you need to get the application fully functional in 2 minutes.

---

## 🔑 1. Pre-Generated Keys (Already Set Up in `.env.local`)

You **do not** need to generate any keys. We have already generated and injected strong, cryptographically secure keys into [`.env.local`](file:///home/kavyapratap/Desktop/maggi/.env.local):

| Key Name | Value | Purpose |
| :--- | :--- | :--- |
| **`ENCRYPTION_KEY`** | `733467698bf3da98db02475044528a720fc11ac89393276d3531cbe0b461b7d9` | AES-256 database content encryption for journal entries and notes |
| **`VAPID_PUBLIC_KEY`** | `BB7UsJA2YC_BaXhXOdiQlTUyG7BiT3dz5V2JoCXZQh53djwOKMqR8SX6_Ns1zX-i3ZH4_EdW25-TpOz3F20AQss` | Browser web push notifications for habit streak reminders |
| **`VAPID_PRIVATE_KEY`** | `OVKqmeqzvgysmkmStPb4sC_BFM8BLgkdmmQ3buDbKc4` | Server-side web push notification signing |

---

## 🌐 2. External Service Links & Setup Steps

### A. Google AI Studio (Free Gemini API Key)
* **Direct Key Link**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
* **Instructions**:
  1. Click the link above and log in with any personal Google account.
  2. Click **"Create API key"**.
  3. Copy your key and paste it into [`.env.local`](file:///home/kavyapratap/Desktop/maggi/.env.local):
     ```env
     GEMINI_API_KEY=your_key_here
     GOOGLE_API_KEY=your_key_here
     ```
  *(100% Free tier, no credit card or billing account needed).*

---

### B. Supabase (Database, Auth & Storage)
* **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
* **Create New Project**: [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
* **Project API Keys**: Go to your project -> **Project Settings** -> **API**
  - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`
  - Copy **anon / public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy **service_role / secret** key into `SUPABASE_SERVICE_ROLE_KEY`
* **Direct SQL Editor**: Open `https://supabase.com/dashboard/project/<your-project-id>/sql/new`

---

## ⚡ 3. One-Click Database Setup (Copy & Paste)

You only need to run **one** file in Supabase to configure the complete backend:

1. Open your project in the [Supabase SQL Editor](https://supabase.com/dashboard).
2. Open the setup file: [`supabase-setup.sql`](file:///home/kavyapratap/Desktop/maggi/supabase-setup.sql) (located at the root of this project).
3. Copy **all** code from `supabase-setup.sql`.
4. Paste it into the Supabase SQL Editor and click **Run** (or press `Ctrl + Enter`).

### What this script automatically configures:
- ✅ **Extensions**: `uuid-ossp` and `pgcrypto`
- ✅ **15 Database Tables**:
  - `profiles` (Streak, tiers, AI usage tracking, theme preferences)
  - `journal_entries` (Analysis, speaking analysis, tags, iterations, audio)
  - `assignments` & `submissions` & `submission_details` (Teacher/student flows)
  - `todo_lists` & `todo_tasks` (Productivity & daily action items)
  - `dictionary_words` (Saved corrections with audio pronunciation links)
  - `hard_words` (Vocabulary study bank)
  - `compared_words` (Nuanced word comparison with encrypted JSON)
  - `compared_sentences` (Sentence context analysis)
  - `practice_sessions` (Interactive quizzes and chat evaluation history)
  - `grammar_mistakes` (Mistake category analytics)
  - `app_settings` (Global AI switches)
  - `push_subscriptions` (VAPID browser notifications)
- ✅ **Row Level Security (RLS)**: Isolated user policies (`auth.uid() = user_id`) on all tables
- ✅ **Storage Bucket**: Creates `journal-media` bucket (10MB limit, audio/images) with secure owner RLS policies
- ✅ **User Trigger**: Automatically creates a profile record whenever a new user signs up
- ✅ **Default Seed**: Inserts baseline system configuration into `app_settings`

---

## 🔐 4. Supabase Auth Configuration (1-Minute Check)

In your Supabase project dashboard:
1. Navigate to **Authentication** -> **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (or `http://localhost:9002` when running locally)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback` and `http://localhost:9002/auth/callback`
2. *(Optional for local development)*: Under **Authentication** -> **Providers** -> **Email**, toggle off **"Confirm email"** so you can log in immediately upon registration.

---

## 🧪 5. Reviewer Demo Mode (Zero Credentials Needed)

If an evaluator or reviewer wants to explore without creating a Supabase account or logging in:
- Simply visit: **`http://localhost:9002/api/demo?action=enter`**
- Or click the **"Feature Demo (No Login Required)"** button on the homepage.
- This immediately logs the reviewer into **Priyanshi Saxena's** demo profile with pre-loaded journal entries, streaks, to-do lists, and hard words!

---

## 💻 6. Running the Project Locally

```bash
# 1. Start the Next.js development server (with Turbopack)
npm run dev

# 2. (Optional) Start the live duplex audio proxy for bidirectional voice:
npm run proxy
```

Open your browser at:
👉 **`http://localhost:9002`** (or `http://localhost:3000`)
