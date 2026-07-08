# Now It Counts (Constella)

**"You've been describing this for years. Now it counts."**

A perimenopause **recognition** companion — built at the ZOE Women in Tech Hackathon, 8–9 July 2026 (Team 3: Detection & Prevention, built the Community & Advocacy way).

Not a tracker. Not MenoScale. A one-time, unhurried conversation that helps a woman recognise that her scattered, dismissed symptoms might have a name — and leaves her with a GP-ready one-page summary in her own words.

## What it does

1. **Consent first** — spoken/read explainer, explicit yes, delete-everything rights stated up front.
2. **Her story first** — open-ended, verbatim capture of what matters most to her.
3. **Symptom check** — 11 recognition symptoms across four roles (anchor / specific / dismissed / supporting), single impact scale, presence before depth.
4. **Duration & impact** — how long, and what it's affected.
5. **Her healthcare journey** — what she was told, verbatim (data no existing instrument collects).
6. **About her, last** — equity layer (age band, ethnicity, language, postcode district), each with a stated reason, all skippable.
7. **Closing** — her GP summary + a share card for the group chat.

## The safety rule (non-negotiable)

"This looks like perimenopause" only ever surfaces when the **anchor** (menstrual change) or a **specific signal** (hot flushes / night sweats) is present. The dismissed cluster (fatigue, brain fog, mood, sleep) amplifies a signal but never creates one alone. **Rules compute the signal; the LLM only phrases it.** Always "a signal worth exploring, not a diagnosis."

## Design principles

Reflect, don't diagnose · "What matters to you?" not "what's the matter with you?" · Value before data · Every question optional · Never alarm · Not a tracker · Data minimisation by default · She's in control.

## Stack

- Next.js + TypeScript + Tailwind (pastel, warm)
- Recognition engine: pure TypeScript rules (unit-tested)
- GP summary phrasing: Claude API, grounded with a curated reference doc
- Voice: ElevenLabs conversational agent (text version is the backbone)
- Storage: session-only for the demo; one-tap delete

## Run it

```bash
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm install
npm run dev
```

---

*Built by Women Defining AI — Team 3. Wording of symptom questions is a draft pending community + clinical read of NICE NG23.*
