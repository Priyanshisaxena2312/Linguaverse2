# Linguaverse: Pricing & Monetization Strategy

## 1. Feature Breakdown by Tier

| Feature | Free | Starter (₹99/mo) | Pro (₹499/mo) | Elite (₹1299/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **Dictionary Lookups** | Unlimited | Unlimited | Unlimited | Unlimited |
| **Standard Text Entries** | Unlimited | Unlimited | Unlimited | Unlimited |
| **AI-Enhanced Entries** | 10 / month | Unlimited | Unlimited | Unlimited |
| **IELTS Insights** | Basic | Full Deep-Dive | Full Deep-Dive | Full Deep-Dive |
| **Hinglish Support** | No | Yes | Yes | Yes |
| **AI Tutor (V2V)** | 5 mins / month | 45 mins / month | 45 mins / week | 100 mins / week |
| **Ads** | Rewarded Ads | Ad-Free | Ad-Free | Ad-Free |
| **Mistake Mastery Quizzes** | 3 / week | 10 / week | Unlimited | Unlimited |

---

## 2. Unit Economics (Cost Analysis)

*Based on Gemini 2.5 Flash Live API Pricing ($1 = ₹83)*
- **Input Audio**: $3 / 1M tokens
- **Output Audio**: $12 / 1M tokens
- **Estimated tokens/min (Full Duplex)**: ~1,000 tokens
- **Cost per Minute**: ~$0.015 (₹1.245)

### Profit/Loss (P/L) per User (at Max Usage)

| Tier | Revenue (INR) | Max AI Tutor Mins | AI Cost (INR) | Gross Profit (INR) | Margin (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free** | ₹0 | 5 | ₹6.23 | -₹6.23* | N/A |
| **Starter** | ₹99 | 60 | ₹74.70 | ₹24.30 | 24.5% |
| **Pro** | ₹499 | 240 (avg) | ₹298.80 | ₹200.20 | 40.1% |
| **Elite** | ₹1299 | 480 (avg) | ₹597.60 | ₹701.40 | 54.0% |

*\*Free tier costs are offset by Rewarded Ads (estimated ₹1-2 per 30s ad).*

---

## 3. The "Hinglish" Value Proposition
- **Premium Feature**: Hinglish explanations are reserved for paid tiers (Starter and above). 
- **Rationale**: The specialized prompting required for high-quality "Pedagogical Code-Switching" consumes more tokens and requires higher-level reasoning (Gemini 2.5 Flash).

## 4. Scalability Plan
1. **Flash-Lite Optimization**: Use Gemini 2.5 Flash-Lite (the cheapest model) for all background normalization and simple grammar checks to keep costs near zero for text entries.
2. **Flash Live for Voice**: Reserve the expensive Live API exclusively for the AI Tutor sessions.
3. **Rewarded Ads**: Users in the Free tier can "Unlock" 2 extra minutes of AI Tutor by watching 2 rewarded video ads (60 seconds total). This turns a cost center into a break-even point.
