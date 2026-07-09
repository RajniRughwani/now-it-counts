"use client";

/**
 * The conversation — one gentle question at a time.
 * Opening consent → Part 1 her story → Part 2 symptom check →
 * Part 3 duration & impact → Part 4 her healthcare journey →
 * Part 5 about her (last) → closing summary.
 *
 * Design principles (non-negotiable): reflect don't diagnose; every question
 * optional; never ask twice; never alarm; demographics last with stated
 * reasons; she's in control.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  Chip,
  PartLabel,
  PrimaryButton,
  ProgressBar,
  Question,
  SkipLink,
  Soft,
} from "@/components/ui";
import { EMPTY_SESSION, SessionData, deleteEverything, saveSession } from "@/lib/session";
import {
  ALL_SYMPTOMS,
  ANCHOR,
  DISMISSED,
  IMPACT_LABELS,
  Impact,
  MENSTRUAL_CHANGE_LABELS,
  MENSTRUAL_CHANGE_SIGNAL,
  MenstrualChange,
  SPECIFIC,
  SUPPORTING,
  SymptomDef,
} from "@/lib/symptoms";

type Stage =
  | "consent"
  | "story"
  | "whatMatters"
  | "bridge"
  | "dismissed"
  | "anchor"
  | "specific"
  | "supporting"
  | "rate"
  | "botherMost"
  | "duration"
  | "lifeAreas"
  | "journeyAsk"
  | "told"
  | "heldBack"
  | "gpOneThing"
  | "aboutBridge"
  | "ageBand"
  | "ethnicity"
  | "language"
  | "postcode";

/** Which of the 5 PRD parts each stage belongs to — drives the progress bar. */
const STAGE_PART: Record<Stage, number> = {
  consent: 0,
  story: 1,
  whatMatters: 1,
  bridge: 2,
  dismissed: 2,
  anchor: 2,
  specific: 2,
  supporting: 2,
  rate: 2,
  botherMost: 2,
  duration: 3,
  lifeAreas: 3,
  journeyAsk: 4,
  told: 4,
  heldBack: 4,
  gpOneThing: 4,
  aboutBridge: 5,
  ageBand: 5,
  ethnicity: 5,
  language: 5,
  postcode: 5,
};
const TOTAL_PARTS = 5;

const AGE_BANDS = ["Under 35", "35–39", "40–44", "45–49", "50–55", "Over 55"];

const ETHNICITIES = [
  "Asian or Asian British",
  "Black, Black British, Caribbean or African",
  "Mixed or multiple ethnic groups",
  "White",
  "Another ethnic group",
];

const LANGUAGES = ["English", "Urdu", "Punjabi", "Bengali", "Gujarati", "Hindi", "Somali", "Polish"];

const DURATIONS = [
  "A few weeks",
  "A few months",
  "About a year",
  "A couple of years",
  "Several years",
  "Hard to say",
];

const LIFE_AREAS = ["Work", "Home life", "Relationships", "Social life", "Exercise & hobbies"];

export default function SessionFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("consent");
  const [data, setData] = useState<SessionData>(EMPTY_SESSION);
  const [text, setText] = useState("");
  const [tapped, setTapped] = useState<string[]>([]);

  useEffect(() => {
    saveSession(data);
  }, [data]);

  const update = (patch: Partial<SessionData>) =>
    setData((d) => ({ ...d, ...patch }));

  const go = (next: Stage) => {
    setText("");
    setTapped([]);
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => router.push("/summary");

  const onDeleteEverything = () => {
    if (confirm("Delete everything from this session? No reason needed, it all goes.")) {
      deleteEverything();
      setData(EMPTY_SESSION);
      router.push("/");
    }
  };

  const toggleTap = (id: string) =>
    setTapped((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  /** Symptoms she said are present (for rating + bother-most). */
  const presentSymptoms: SymptomDef[] = ALL_SYMPTOMS.filter(
    (s) => s.id !== ANCHOR.id && data.impacts[s.id] !== undefined,
  );

  const botherOptions: SymptomDef[] = [
    ...(data.menstrualChange && MENSTRUAL_CHANGE_SIGNAL.has(data.menstrualChange)
      ? [ANCHOR]
      : []),
    ...presentSymptoms,
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-xl flex items-center justify-between mb-6">
        <span className="font-medium tracking-wide">DOT</span>
        <button
          type="button"
          onClick={onDeleteEverything}
          className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Delete everything
        </button>
      </header>

      {STAGE_PART[stage] > 0 && (
        <ProgressBar current={STAGE_PART[stage]} total={TOTAL_PARTS} />
      )}

      {stage === "consent" && (
        <Card>
          <PartLabel>Before we start</PartLabel>
          <Question>30 seconds, promise.</Question>
          <div className="space-y-3 text-[15px] leading-relaxed mb-6">
            <p>This is a chat, not a quiz. Skip anything, stop anytime.</p>
            <p>
              You&apos;ll leave with <strong>the words</strong>: for the GP,
              the pharmacy, the group chat.
            </p>
            <p>
              Say yes below, and your answers join thousands of others,{" "}
              <strong>anonymously</strong>, to build the evidence about
              women&apos;s health the UK still doesn&apos;t have.
            </p>
            <p className="text-muted">
              No name. No audio kept. One tap deletes everything, no reason
              needed.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              onClick={() => {
                update({ consented: true });
                go("story");
              }}
            >
              Yes, I&apos;m happy to start
            </PrimaryButton>
            <SkipLink onClick={() => router.push("/")} label="Not today" />
          </div>
        </Card>
      )}

      {stage === "story" && (
        <Card>
          <PartLabel>Your story</PartLabel>
          <Question>Let&apos;s start with you.</Question>
          <Soft>
            How have you been feeling lately, in yourself, your energy, your
            mood, your body? Tell me in your own words, however you&apos;d say it
            to a friend. What&apos;s changed recently? What bothers you most?
          </Soft>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="However you'd say it to a friend…"
            className="w-full rounded-2xl border border-line bg-rose-mist/40 p-4 text-base focus:outline-none focus:border-rose mb-4"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              disabled={!text.trim()}
              onClick={() => {
                update({ story: text.trim() });
                go("whatMatters");
              }}
            >
              That&apos;s my story
            </PrimaryButton>
            <SkipLink onClick={() => go("whatMatters")} label="I'd rather skip this" />
          </div>
        </Card>
      )}

      {stage === "whatMatters" && (
        <Card>
          <PartLabel>Your story</PartLabel>
          {data.story && (
            <Soft>
              Thank you for trusting me with that. I heard you: &ldquo;
              {data.story.length > 160 ? data.story.slice(0, 160) + "…" : data.story}
              &rdquo;
            </Soft>
          )}
          <Question>What matters most to you right now?</Question>
          <Soft>Sleeping well, feeling like yourself again, just knowing what this is, whatever it is, in your words.</Soft>
          <div className="flex flex-wrap gap-2 mb-4">
            {["Sleeping properly again", "Feeling like myself", "Just knowing what this is"].map(
              (opt) => (
                <Chip key={opt} selected={text === opt} onClick={() => setText(opt)}>
                  {opt}
                </Chip>
              ),
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Or say it your way…"
            className="w-full rounded-2xl border border-line bg-rose-mist/40 p-4 text-base focus:outline-none focus:border-rose mb-4"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              disabled={!text.trim()}
              onClick={() => {
                update({ whatMatters: text.trim() });
                go("bridge");
              }}
            >
              Continue
            </PrimaryButton>
            <SkipLink onClick={() => go("bridge")} />
          </div>
        </Card>
      )}

      {stage === "bridge" && (
        <Card>
          <PartLabel>How you&apos;ve been</PartLabel>
          <Question>This isn&apos;t a checklist.</Question>
          <Soft>
            I&apos;ll mention a few things other women often describe. Tap
            anything that sounds familiar, and ignore anything that doesn&apos;t.
            There are no wrong answers, and you can skip whatever you like.
          </Soft>
          <PrimaryButton onClick={() => go("dismissed")}>Okay</PrimaryButton>
        </Card>
      )}

      {stage === "dismissed" && (
        <SymptomTapScreen
          part="How you've been"
          question="Do any of these sound familiar?"
          soft="These get brushed off as 'just stress' all the time. They're real."
          symptoms={DISMISSED}
          tapped={tapped}
          onTap={toggleTap}
          onNext={() => {
            const impacts = { ...data.impacts };
            for (const id of tapped) impacts[id] = "a_little";
            update({ impacts });
            go("anchor");
          }}
          onSkip={() => go("anchor")}
        />
      )}

      {stage === "anchor" && (
        <Card>
          <PartLabel>One gentle question</PartLabel>
          <Question>{ANCHOR.screenWording}</Question>
          <Soft>
            This one matters more than it seems: it&apos;s often the clearest
            clue a body gives. Whatever the answer, it&apos;s useful.
          </Soft>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MENSTRUAL_CHANGE_LABELS) as MenstrualChange[]).map((opt) => (
              <Chip
                key={opt}
                selected={data.menstrualChange === opt}
                onClick={() => {
                  update({ menstrualChange: opt });
                  setTimeout(() => go("specific"), 250);
                }}
              >
                {MENSTRUAL_CHANGE_LABELS[opt]}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {stage === "specific" && (
        <SymptomTapScreen
          part="How you've been"
          question="And either of these?"
          soft="Sudden waves of heat, day or night, even occasionally."
          symptoms={SPECIFIC}
          tapped={tapped}
          onTap={toggleTap}
          onNext={() => {
            const impacts = { ...data.impacts };
            for (const id of tapped) impacts[id] = "a_little";
            update({ impacts });
            go("supporting");
          }}
          onSkip={() => go("supporting")}
        />
      )}

      {stage === "supporting" && (
        <SymptomTapScreen
          part="How you've been"
          question="Last few: any of these?"
          soft="Small things count too. They help build the full picture."
          symptoms={SUPPORTING}
          tapped={tapped}
          onTap={toggleTap}
          gentleFlagFor={(s) => (tapped.includes(s.id) ? s.gentleFlag : undefined)}
          onNext={() => {
            const impacts = { ...data.impacts };
            for (const id of tapped) impacts[id] = "a_little";
            update({ impacts });
            go(Object.keys(impacts).length > 0 ? "rate" : "duration");
          }}
          onSkip={() =>
            go(Object.keys(data.impacts).length > 0 ? "rate" : "duration")
          }
        />
      )}

      {stage === "rate" && (
        <Card>
          <PartLabel>How you&apos;ve been</PartLabel>
          <Question>How much does each of these get in your way?</Question>
          <Soft>Day to day, not at your worst, just typically.</Soft>
          <div className="space-y-5 mb-6">
            {presentSymptoms.map((s) => (
              <div key={s.id}>
                <p className="text-[15px] font-medium mb-2">{s.shortLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(IMPACT_LABELS) as Impact[]).map((level) => (
                    <Chip
                      key={level}
                      selected={data.impacts[s.id] === level}
                      onClick={() =>
                        update({ impacts: { ...data.impacts, [s.id]: level } })
                      }
                    >
                      {IMPACT_LABELS[level]}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton onClick={() => go("botherMost")}>Continue</PrimaryButton>
            <SkipLink onClick={() => go("botherMost")} />
          </div>
        </Card>
      )}

      {stage === "botherMost" && (
        <Card>
          <PartLabel>How you&apos;ve been</PartLabel>
          <Question>Which one or two bother you the most?</Question>
          <Soft>
            This becomes the heart of your summary: the thing you most want
            taken seriously.
          </Soft>
          <div className="flex flex-wrap gap-2 mb-6">
            {botherOptions.map((s) => (
              <Chip
                key={s.id}
                selected={tapped.includes(s.id)}
                onClick={() => {
                  if (tapped.includes(s.id)) {
                    setTapped(tapped.filter((x) => x !== s.id));
                  } else if (tapped.length < 2) {
                    setTapped([...tapped, s.id]);
                  }
                }}
              >
                {s.shortLabel}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              disabled={tapped.length === 0}
              onClick={() => {
                update({ bothersMost: tapped });
                go("duration");
              }}
            >
              Continue
            </PrimaryButton>
            <SkipLink onClick={() => go("duration")} />
          </div>
        </Card>
      )}

      {stage === "duration" && (
        <Card>
          <PartLabel>Over time</PartLabel>
          <Question>Roughly how long has this been going on?</Question>
          <div className="flex flex-wrap gap-2 mb-6">
            {DURATIONS.map((d) => (
              <Chip
                key={d}
                selected={data.duration === d}
                onClick={() => {
                  update({ duration: d });
                  setTimeout(() => go("lifeAreas"), 250);
                }}
              >
                {d}
              </Chip>
            ))}
          </div>
          <SkipLink onClick={() => go("lifeAreas")} />
        </Card>
      )}

      {stage === "lifeAreas" && (
        <Card>
          <PartLabel>Over time</PartLabel>
          <Question>Has it touched any of these?</Question>
          <Soft>Tap any that fit.</Soft>
          <div className="flex flex-wrap gap-2 mb-6">
            {LIFE_AREAS.map((a) => (
              <Chip key={a} selected={tapped.includes(a)} onClick={() => toggleTap(a)}>
                {a}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              disabled={tapped.length === 0}
              onClick={() => {
                update({ lifeAreas: tapped });
                go("journeyAsk");
              }}
            >
              Continue
            </PrimaryButton>
            <SkipLink onClick={() => go("journeyAsk")} />
          </div>
        </Card>
      )}

      {stage === "journeyAsk" && (
        <Card>
          <PartLabel>Your journey so far</PartLabel>
          <Question>
            Have you spoken to a GP, or anyone, about any of this?
          </Question>
          <div className="flex flex-wrap gap-2 mb-6">
            <Chip
              selected={data.spokenToAnyone === "yes"}
              onClick={() => {
                update({ spokenToAnyone: "yes" });
                setTimeout(() => go("told"), 250);
              }}
            >
              Yes, I have
            </Chip>
            <Chip
              selected={data.spokenToAnyone === "no"}
              onClick={() => {
                update({ spokenToAnyone: "no" });
                setTimeout(() => go("heldBack"), 250);
              }}
            >
              No, not yet
            </Chip>
          </div>
          <SkipLink onClick={() => go("gpOneThing")} />
        </Card>
      )}

      {stage === "told" && (
        <FreeTextScreen
          part="Your journey so far"
          question="What did they say, and was anything offered?"
          soft="In your own words. Exactly as you remember it."
          text={text}
          setText={setText}
          onNext={() => {
            update({ toldVerbatim: text.trim() || null });
            go("gpOneThing");
          }}
          onSkip={() => go("gpOneThing")}
        />
      )}

      {stage === "heldBack" && (
        <FreeTextScreen
          part="Your journey so far"
          question="No judgement at all: what's held you back?"
          soft="Time, not wanting to make a fuss, not knowing what to say, past experiences… anything."
          text={text}
          setText={setText}
          onNext={() => {
            update({ heldBack: text.trim() || null });
            go("gpOneThing");
          }}
          onSkip={() => go("gpOneThing")}
        />
      )}

      {stage === "gpOneThing" && (
        <FreeTextScreen
          part="Your journey so far"
          question="If your GP could know just one thing about what this has really been like, what would it be?"
          soft="This goes at the top of your summary, in your words."
          text={text}
          setText={setText}
          onNext={() => {
            update({ gpOneThing: text.trim() || null });
            go("aboutBridge");
          }}
          onSkip={() => go("aboutBridge")}
        />
      )}

      {stage === "aboutBridge" && (
        <Card>
          <PartLabel>Nearly there</PartLabel>
          <Question>Four quick things about you, each with a reason.</Question>
          <Soft>
            These are what turn thousands of individual stories into evidence
            that health services can&apos;t ignore. Every one is optional, and
            none can identify you.
          </Soft>
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton onClick={() => go("ageBand")}>Okay</PrimaryButton>
            <SkipLink onClick={finish} label="Skip all of these" />
          </div>
        </Card>
      )}

      {stage === "ageBand" && (
        <ChoiceScreen
          part="About you"
          question="Which age group are you in?"
          soft="Why we ask: perimenopause starts years earlier for some communities. Age bands (never your date of birth) make that visible."
          options={AGE_BANDS}
          selected={data.ageBand}
          onSelect={(v) => {
            update({ ageBand: v });
            setTimeout(() => go("ethnicity"), 250);
          }}
          onSkip={() => go("ethnicity")}
        />
      )}

      {stage === "ethnicity" && (
        <Card>
          <PartLabel>About you</PartLabel>
          <Question>How would you describe your ethnicity?</Question>
          <Soft>
            Why we ask: symptoms start earlier and show up differently across
            ethnic groups, and some groups are far less likely to be offered
            help. This is how that becomes impossible to ignore.
          </Soft>
          <div className="flex flex-wrap gap-2 mb-4">
            {ETHNICITIES.map((e) => (
              <Chip
                key={e}
                selected={data.ethnicity === e}
                onClick={() => {
                  update({ ethnicity: e });
                  setTimeout(() => go("language"), 250);
                }}
              >
                {e}
              </Chip>
            ))}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or describe it your own way…"
            className="w-full rounded-2xl border border-line bg-rose-mist/40 p-3 text-base focus:outline-none focus:border-rose mb-4"
          />
          <div className="flex items-center gap-4 flex-wrap">
            {text.trim() && (
              <PrimaryButton
                onClick={() => {
                  update({ ethnicity: text.trim() });
                  go("language");
                }}
              >
                Continue
              </PrimaryButton>
            )}
            <SkipLink onClick={() => go("language")} label="Prefer not to say" />
          </div>
        </Card>
      )}

      {stage === "language" && (
        <Card>
          <PartLabel>About you</PartLabel>
          <Question>
            Which language would you most want a health conversation in?
          </Question>
          <Soft>
            Why we ask: health conversations work better in the language you
            think in, services should know which ones are missing.
          </Soft>
          <div className="flex flex-wrap gap-2 mb-4">
            {LANGUAGES.map((l) => (
              <Chip
                key={l}
                selected={data.language === l}
                onClick={() => {
                  update({ language: l });
                  setTimeout(() => go("postcode"), 250);
                }}
              >
                {l}
              </Chip>
            ))}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Another language…"
            className="w-full rounded-2xl border border-line bg-rose-mist/40 p-3 text-base focus:outline-none focus:border-rose mb-4"
          />
          <div className="flex items-center gap-4 flex-wrap">
            {text.trim() && (
              <PrimaryButton
                onClick={() => {
                  update({ language: text.trim() });
                  go("postcode");
                }}
              >
                Continue
              </PrimaryButton>
            )}
            <SkipLink onClick={() => go("postcode")} label="Prefer not to say" />
          </div>
        </Card>
      )}

      {stage === "postcode" && (
        <Card>
          <PartLabel>About you</PartLabel>
          <Question>
            And just the first half of your postcode, like &ldquo;LS8&rdquo; or
            &ldquo;E7&rdquo;.
          </Question>
          <Soft>
            Why we ask: it shows where services aren&apos;t reaching, without
            ever pointing to a street or a door. Never the full postcode.
          </Soft>
          <input
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. LS8"
            className="w-40 rounded-2xl border border-line bg-rose-mist/40 p-3 text-base tracking-widest focus:outline-none focus:border-rose mb-4"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <PrimaryButton
              disabled={!text.trim()}
              onClick={() => {
                update({ postcodeDistrict: text.trim() });
                finish();
              }}
            >
              Finish: show my summary
            </PrimaryButton>
            <SkipLink onClick={finish} label="Prefer not to say, show my summary" />
          </div>
        </Card>
      )}
    </main>
  );
}

/* ---------- shared sub-screens ---------- */

function SymptomTapScreen({
  part,
  question,
  soft,
  symptoms,
  tapped,
  onTap,
  onNext,
  onSkip,
  gentleFlagFor,
}: {
  part: string;
  question: string;
  soft: string;
  symptoms: SymptomDef[];
  tapped: string[];
  onTap: (id: string) => void;
  onNext: () => void;
  onSkip: () => void;
  gentleFlagFor?: (s: SymptomDef) => string | undefined;
}) {
  return (
    <Card>
      <PartLabel>{part}</PartLabel>
      <Question>{question}</Question>
      <Soft>{soft}</Soft>
      <div className="flex flex-col gap-2 mb-2">
        {symptoms.map((s) => (
          <div key={s.id}>
            <Chip selected={tapped.includes(s.id)} onClick={() => onTap(s.id)}>
              {s.screenWording}
            </Chip>
            {gentleFlagFor?.(s) && (
              <p className="text-xs text-sage mt-1 ml-2 gentle-in">
                {gentleFlagFor(s)}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 flex-wrap mt-4">
        <PrimaryButton onClick={onNext} disabled={tapped.length === 0}>
          Continue
        </PrimaryButton>
        <SkipLink onClick={onSkip} label="None of these, move on" />
      </div>
    </Card>
  );
}

function FreeTextScreen({
  part,
  question,
  soft,
  text,
  setText,
  onNext,
  onSkip,
}: {
  part: string;
  question: string;
  soft: string;
  text: string;
  setText: (t: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <Card>
      <PartLabel>{part}</PartLabel>
      <Question>{question}</Question>
      <Soft>{soft}</Soft>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-line bg-rose-mist/40 p-4 text-base focus:outline-none focus:border-rose mb-4"
      />
      <div className="flex items-center gap-4 flex-wrap">
        <PrimaryButton disabled={!text.trim()} onClick={onNext}>
          Continue
        </PrimaryButton>
        <SkipLink onClick={onSkip} />
      </div>
    </Card>
  );
}

function ChoiceScreen({
  part,
  question,
  soft,
  options,
  selected,
  onSelect,
  onSkip,
}: {
  part: string;
  question: string;
  soft: string;
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  onSkip: () => void;
}) {
  return (
    <Card>
      <PartLabel>{part}</PartLabel>
      <Question>{question}</Question>
      <Soft>{soft}</Soft>
      <div className="flex flex-wrap gap-2 mb-6">
        {options.map((o) => (
          <Chip key={o} selected={selected === o} onClick={() => onSelect(o)}>
            {o}
          </Chip>
        ))}
      </div>
      <SkipLink onClick={onSkip} label="Prefer not to say" />
    </Card>
  );
}
