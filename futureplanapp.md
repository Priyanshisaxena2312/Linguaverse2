# Linguaverse: Future Roadmap

## 1. Native Language Support (Hinglish)
- **Objective**: Allow users to receive pedagogical explanations and corrections in their native tongue or a hybrid (e.g., Hinglish).
- **Phased Approach**:
    - **Phase 1 [COMPLETED]**: Hindi & Hinglish support for Written & Spoken Analysis.
    - **Phase 2[FUTURE]**: Multi-language support (Spanish, French, German) for global expansion.
    - **Phase 3[COMPLETED]**: Toggle in Profile to switch between English-only and Native-assisted learning.

## 2. Gemini Live Voice-to-Voice (V2V)
- **Objective**: Achieve 1:1 parity with the Next.js AI tutor using the `gemini-live-2.5-flash-native-audio` model.
- **Key Features**:
    - Zero-latency turn-based conversation.
    - Emotion-aware AI responses.
    - Real-time phonetic correction during live speech.

## 3. Social & Competitive Learning
- **Leaderboards**: Daily streaks and "Most Improved" badges.
- **English Duels**: 2-minute timed conversation or quiz against another user to boost retention.
- **Shared Mistakes**: Opt-in to share common mistakes with the community for collective learning.

## 4. Advanced Pedagogical Engine (Semantic Brain)
- **Shadowing Mode (Phonetic Mastery)**: Users listen to a high-level English clip (e.g., a TED Talk or news snippet) and repeat it, getting real-time phonetic heatmaps (green for perfect, red for mispronounced).
- **Blank Screen Solver[COMPLETED]**: AI automatically detects when a user is stuck and looks at their recent lookup history and phrases. It then frames a personalized prompt (e.g., "You recently looked up 'Eloquent'. Can you write about a person you find truly eloquent?") to spark writing.
- **Band Breakthrough Diagnostics[COMPLETED]**: Track why a user is stuck in a specific IELTS band. Semantic AI identifies recurring patterns (e.g., "You have mastered simple past, but your lack of complex conditionals is keeping you at Band 6.5") and gives targeted corrective tasks.
- **AI Reading Lab**: Users can choose to speak spontaneously or "Read Aloud". AI generates a tailored 30s-1min paragraph (approx 200-500 words adjusted to user band) for the user to read. AI then provides deep analysis on fluency, stress, and pronunciation.

## 5. [IMPORTANT - ASAP] The Inkling Daily Digest (Curated Content Feed)
- **Objective**: Transform user mistakes into a personalized learning library.
- **AI-Generated Articles**: Use **Gemini 2.5 Flash Lite** to generate 100% copyright-free, hyper-personalized articles/stories based on the user's specific vocabulary gaps and grammar mistakes.
- **Pedagogical Integration**: Each article is private and acts as a "Mirror" of the user's recent performance. If a user struggled with semicolons, the AI writes a story that *demonstrates* perfect semicolon usage in context.
- **Growth Loops**: Articles include "Interactive Callouts" explaining why certain phrases were used, directly referencing the user's past mistakes.
- **Future Human Integration**: Open the platform for humans/teachers to post "Templates" that the AI then customizes for individual user levels.

## 6. Parental & Tutor Ecosystem
- **Automated Transparency**: Weekly progress reports sent via WhatsApp/Email to parents or mentors to justify the ROI of the learning journey.

## 7. [IMPORTANT] Identity-Bound (UID) Encryption Migration
- **Objective**: Transition from a static app-wide key to **User-Specific UID-Derived Keys**.
- **The Logic**: `Key = HMAC-SHA256(Firebase_UID + App_Secret_Salt)`.
- **Key Benefits**:
    - **High-End Privacy**: Each user has a unique lock; no global key exists to unlock all users.
    - **Seamless Cross-Device Access**: Since the UID is permanent and synced via Firebase, the user gets the same key on any device they log into.
    - **No Key Loss**: As long as the user can log into their account, their encryption key is automatically re-generated.
- **Considerations**: 
    - **Migration**: Current test data encrypted with the old static key will be lost/unreadable after the switch.
    - **Implementation**: Update `EncryptionManager` to accept UID as a seed for key derivation.

## 8. [DISCUSS MORE] Server-Side AI Gateway (Cost & Security)
- **Objective**: Transition from direct mobile-to-Gemini calls to a server-side "Gatekeeper".
- **Why**: 
    - **Cost Protection**: Prevent malicious users from draining API credits.
    - **Rate Limiting**: Control high-volume AI requests.
    - **Security**: Move orchestration logic and API keys off the client device.
- **Potential Tech Stack**: Firebase Cloud Functions or a Ktor (Kotlin) backend.
