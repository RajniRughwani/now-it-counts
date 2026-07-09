"use client";

/**
 * Closing — her record. "You've been describing this for years. Your story matters."
 * The card itself is built entirely from buildRecordCard() (deterministic,
 * no LLM) via /api/summary; only the "for the group chat" share card below
 * it is LLM-generated. Session data never persists beyond this browser
 * session.
 */

import { toPng } from "html-to-image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card, PartLabel, Question, Soft } from "@/components/ui";
import { PillTone, RecordCardData } from "@/lib/recordCard";
import { deleteEverything, loadSession } from "@/lib/session";

interface SummaryResponse {
  card: RecordCardData;
  shareCard: string | null;
}

const PILL_CLASSES: Record<PillTone, string> = {
  cycle: "bg-lavender-soft text-lavender-deep",
  mild: "bg-sage-soft text-sage-deep",
  moderate: "bg-apricot-soft text-apricot-deep",
  severe: "bg-pink-soft text-pink-deep",
};

export default function SummaryPage() {
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const requested = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requested.current) return; // never generate twice
    requested.current = true;
    const session = loadSession();
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    })
      .then(async (r) => {
        if (!r.ok) {
          setFailed(true);
          return;
        }
        const body = (await r.json()) as SummaryResponse;
        setResult(body);
      })
      .catch(() => setFailed(true));
  }, []);

  const onDelete = () => {
    if (confirm("Delete everything? No reason needed, it all goes.")) {
      deleteEverything();
      window.location.href = "/";
    }
  };

  const copyShareCard = async () => {
    if (!result?.shareCard) return;
    await navigator.clipboard.writeText(result.shareCard);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const saveAsImage = async () => {
    if (!cardRef.current || !result?.card) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `now-it-counts-summary-${result.card.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image export failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAsPdf = () => window.print();

  const card = result?.card;
  const amber = card?.acknowledgement.variant === "amber";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 gap-6">
      <header className="w-full max-w-3xl flex items-center justify-between print:hidden">
        <span className="font-medium tracking-wide">DOT</span>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Delete everything
        </button>
      </header>

      {!result && !failed && (
        <Card>
          <PartLabel>Nearly done</PartLabel>
          <Question>Putting your words into one page…</Question>
          <Soft>
            Written in language any healthcare practitioner will recognise,
            but rooted in what you actually said.
          </Soft>
          <div className="flex gap-1.5 mt-2" aria-label="loading">
            <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:300ms]" />
          </div>
        </Card>
      )}

      {failed && (
        <Card>
          <PartLabel>A small hiccup</PartLabel>
          <Question>We couldn&apos;t write your page just now.</Question>
          <Soft>
            Nothing you shared has been lost from this session, and nothing has
            been stored anywhere else. You can try again in a moment.
          </Soft>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-rose hover:bg-rose-deep text-white px-6 py-3 text-base font-medium transition-colors"
          >
            Try again
          </button>
        </Card>
      )}

      {card && (
        <>
          <div
            ref={cardRef}
            className="w-full max-w-3xl bg-card rounded-3xl p-6 sm:p-8 flex flex-col gap-6"
          >
            {/* 1. Header */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
                My record · DOT
              </p>
              <h1 className="text-xl sm:text-2xl font-medium mb-1">What I want understood</h1>
              <p className="text-sm text-muted leading-relaxed">
                Yours to keep, screenshot it or download it for your appointment.
              </p>
            </div>

            {/* 2. Acknowledgement */}
            <div
              className={`rounded-2xl p-5 sm:p-6 text-white ${
                amber ? "bg-amber-deep" : "bg-rose-deep"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
                What we want you to know
              </p>
              <p className="font-serif italic text-lg leading-relaxed">
                &ldquo;{card.acknowledgement.text}&rdquo;
              </p>
              {card.gpOneThing && (
                <p className="font-serif italic text-sm leading-relaxed mt-3 text-white/80">
                  &ldquo;{card.gpOneThing}&rdquo;
                </p>
              )}
            </div>

            {/* 3 + 4. You told us / Clinician summary */}
            {(card.symptomLines.length > 0 || card.clinicianRows.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {card.symptomLines.length > 0 && (
                  <div className="border border-line rounded-2xl p-5">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted mb-3">
                      <span className="w-2 h-2 rounded-full bg-lavender" aria-hidden />
                      What you told us
                    </p>
                    <ul className="text-[15px] leading-relaxed divide-y divide-line">
                      {card.symptomLines.map((line, i) => (
                        <li key={i} className="flex justify-between gap-3 py-2">
                          <span>{line.label}</span>
                          <span className="text-muted text-sm whitespace-nowrap">
                            {line.frequency} · {line.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {card.clinicianRows.length > 0 && (
                  <div className="border border-line rounded-2xl p-5">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted mb-3">
                      <span className="w-2 h-2 rounded-full bg-sage" aria-hidden />
                      Clinician summary
                    </p>
                    <ul className="text-[15px] leading-relaxed divide-y divide-line">
                      {card.clinicianRows.map((row, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-2">
                          <span>{row.term}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${PILL_CLASSES[row.pillTone]}`}
                          >
                            {row.pillLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted mt-3">
                      {card.ageBand && <>Age band: {card.ageBand}. </>}
                      {card.previouslySeen === true && "Previously raised with a practitioner"}
                      {card.previouslySeen === false && "Has not previously raised this"}
                      {card.previouslySeen !== null && " · "}
                      Self-reported, {card.date}. Not a diagnosis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Life impact callout */}
            {card.lifeAreas.length > 0 && (
              <div className="rounded-2xl bg-lavender-soft p-4 flex items-center gap-3 text-[15px] leading-relaxed">
                <span aria-hidden>🕐</span>
                <p>
                  You said this has been affecting your{" "}
                  <strong>{card.lifeAreas.join(", ")}</strong>.
                </p>
              </div>
            )}

            {/* 5 + 6. What would help you */}
            {card.recommendations.length > 0 && (
              <div className="border border-line rounded-2xl p-5 sm:p-6">
                <h2 className="font-serif italic text-lg text-rose mb-1">What would help you</h2>
                <p className="text-sm text-muted mb-4">Small steps and your next conversation.</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
                      Try tonight
                    </p>
                    <ul className="text-[15px] leading-relaxed space-y-2">
                      {card.recommendations.map((rec) => (
                        <li key={rec.id} className="flex gap-2">
                          <span aria-hidden>☐</span>
                          <span>{rec.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
                      Resources &amp; community
                    </p>
                    <p className="text-[15px] leading-relaxed">
                      Short guides on understanding perimenopause, plus women sharing
                      similar experiences.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Close */}
            <div className="text-center text-[15px] leading-relaxed border-t border-line pt-5">
              <p>
                Take this to your community healthcare nurse or doctor.
                You&apos;ve been describing this for years.{" "}
                <span className="text-rose font-medium">Your story matters.</span>
              </p>
              <p className="text-xs text-muted mt-3">
                Generated {card.date}{" "}· nothing here you didn&apos;t choose to share
              </p>
            </div>
          </div>

          <div className="w-full max-w-3xl flex items-center justify-between flex-wrap gap-3 print:hidden">
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={saveAsImage}
                disabled={downloading}
                className="rounded-full bg-rose hover:bg-rose-deep text-white px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {downloading ? "Preparing…" : "✓ Save & take to appointment"}
              </button>
              <button
                type="button"
                onClick={downloadAsPdf}
                className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors"
              >
                Download PDF
              </button>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
            >
              Delete everything
            </button>
          </div>

          {result?.shareCard && (
            <div className="print:hidden">
              <Card>
                <PartLabel>For the group chat</PartLabel>
                <Soft>
                  Because the next woman usually hears it from a friend before she
                  hears it from a doctor.
                </Soft>
                <p className="rounded-2xl bg-apricot-soft p-4 text-[15px] leading-relaxed mb-4">
                  {result.shareCard}
                </p>
                <button
                  type="button"
                  onClick={copyShareCard}
                  className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors"
                >
                  {copiedShare ? "Copied ✓" : "Copy to share"}
                </button>
              </Card>
            </div>
          )}

          <Link
            href="/"
            className="text-sm text-muted underline underline-offset-4 print:hidden"
          >
            Back to the start
          </Link>
        </>
      )}
    </main>
  );
}
