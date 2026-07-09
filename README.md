# DOT

**"You've been describing this for years. Your story matters."**

A perimenopause **recognition** companion — built at the ZOE Women in Tech Hackathon, 8–9 July 2026 (Team 3: Detection & Prevention, built the Community & Advocacy way).

Not a tracker. Not MenoScale. A one-time, unhurried conversation that helps a woman recognise that her scattered, dismissed symptoms might have a name — and leaves her with a practitioner-ready one-page summary in her own words.

## What it does

1. **Consent first** — spoken/read explainer, explicit yes, delete-everything rights stated up front.
2. **Her story first** — open-ended, verbatim capture of what matters most to her.
3. **Symptom check** — 12 recognition symptoms across four roles (anchor / specific / dismissed / supporting), plus verbatim capture of anything reported outside the defined set, single impact scale, presence before depth.
4. **Duration & impact** — how long, and what it's affected.
5. **Her healthcare journey** — what she was told, verbatim (data no existing instrument collects).
6. **About her, last** — equity layer (age band, ethnicity, language, postcode district), each with a stated reason, all skippable.
7. **Closing** — her health summary + a share card for the group chat.

## The safety rule (non-negotiable)

Guidance is always given, never withheld, but its confidence scales with what's present. A **confident** signal ("consistent with perimenopause") only ever surfaces when the **anchor** (menstrual change) or a **specific signal** (hot flushes / night sweats) is present. Everything else — the dismissed cluster (fatigue, brain fog, anxiety, low mood/irritability, sleep), supporting symptoms (joint aches, weight/bloating, urinary changes), and anything reported outside the defined set — can only ever produce **soft**, hedged guidance ("can sometimes relate to perimenopause, among other things"), never confident guidance on its own. Life context (a typical day, her biggest worry) is recorded for the human picture but is walled off from the signal entirely. **Rules compute the signal; the LLM only phrases it.** Never a diagnosis, always a conversation with a healthcare practitioner.

## Design principles

Reflect, don't diagnose · "What matters to you?" not "what's the matter with you?" · Value before data · Every question optional · Never alarm · Not a tracker · Data minimisation by default · She's in control.

## Stack

- Next.js + TypeScript + Tailwind (pastel, warm)
- Recognition engine: pure TypeScript rules (unit-tested)
- Health summary phrasing: Claude API, grounded with a curated reference doc
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
