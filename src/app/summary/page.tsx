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
import { RecordCardData } from "@/lib/recordCard";
import { deleteEverything, loadSession } from "@/lib/session";

interface SummaryResponse {
  card: RecordCardData;
  shareCard: string | null;
}

const PREVIOUSLY_SEEN_LABEL: Record<"yes" | "no" | "unknown", string> = {
  yes: "Yes, has raised this before",
  no: "No, has not raised this before",
  unknown: "Not shared",
};

function buildPlainText(card: RecordCardData): string {
  const lines: string[] = [];
  lines.push("MY RECORD - DOT");
  lines.push("What I want understood");
  lines.push("");
  lines.push(card.acknowledgement.text);
  if (card.gpOneThing) lines.push(`"${card.gpOneThing}"`);
  lines.push("");
  lines.push("You told us:");
  for (const line of card.symptomLines) {
    lines.push(`- ${line.label}: ${line.frequency}, ${line.duration}`);
  }
  if (card.lifeImpactLine) lines.push(card.lifeImpactLine);
  lines.push("");
  lines.push("For your appointment (clinician summary):");
  for (const row of card.clinicianRows) {
    lines.push(`- ${row.term}: ${row.detail}`);
  }
  if (card.ageBand) lines.push(`Age band: ${card.ageBand}`);
  const seen =
    card.previouslySeen === null ? "unknown" : card.previouslySeen ? "yes" : "no";
  lines.push(PREVIOUSLY_SEEN_LABEL[seen]);
  lines.push(`Self-reported conversation, ${card.date}. Not a diagnosis.`);
  lines.push("");
  lines.push("What would help:");
  for (const rec of card.recommendations) {
    lines.push(`- ${rec.text}`);
  }
  lines.push("");
  lines.push(
    "Take this to your community healthcare nurse or doctor. You've been describing this for years. Your story matters.",
  );
  return lines.join("\n");
}

export default function SummaryPage() {
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
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

  const copyAsText = async () => {
    if (!result?.card) return;
    await navigator.clipboard.writeText(buildPlainText(result.card));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const downloadAsImage = async () => {
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

  const card = result?.card;
  const amber = card?.acknowledgement.variant === "amber";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 gap-6">
      <header className="w-full max-w-xl flex items-center justify-between print:hidden">
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
            className="w-full max-w-[380px] bg-card rounded-3xl p-6 flex flex-col gap-5"
          >
            {/* 1. Header */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
                My record · DOT
              </p>
              <h1 className="text-xl font-medium mb-1">What I want understood</h1>
              <p className="text-sm text-muted leading-relaxed">
                Yours to keep, screenshot it or download it for your appointment.
              </p>
            </div>

            {/* 2. Acknowledgement */}
            <div
              className={`rounded-2xl p-4 text-[15px] leading-relaxed ${
                amber ? "bg-apricot-soft" : "bg-rose-mist"
              }`}
            >
              <p>{card.acknowledgement.text}</p>
              {card.gpOneThing && (
                <p className="italic mt-3">&ldquo;{card.gpOneThing}&rdquo;</p>
              )}
            </div>

            {/* 3. You told us */}
            {card.symptomLines.length > 0 && (
              <div>
                <h2 className="text-sm font-medium mb-2">You told us</h2>
                <ul className="text-[15px] leading-relaxed divide-y divide-line">
                  {card.symptomLines.map((line, i) => (
                    <li key={i} className="flex justify-between gap-3 py-1.5">
                      <span>{line.label}</span>
                      <span className="text-muted text-sm whitespace-nowrap">
                        {line.frequency} · {line.duration}
                      </span>
                    </li>
                  ))}
                </ul>
                {card.lifeImpactLine && (
                  <p className="text-[15px] leading-relaxed mt-2">{card.lifeImpactLine}</p>
                )}
              </div>
            )}

            {/* 4. For your appointment */}
            {card.clinicianRows.length > 0 && (
              <div className="border border-line rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
                  Clinician summary
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {card.clinicianRows.map((row, i) => (
                      <tr key={i} className="border-t border-line first:border-t-0">
                        <td className="py-1.5 pr-2">{row.term}</td>
                        <td className="py-1.5 text-right text-muted whitespace-nowrap">
                          {row.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm mt-3">
                  {card.ageBand && <>Age band: {card.ageBand}. </>}
                  {card.previouslySeen === true && "Previously raised this with a practitioner."}
                  {card.previouslySeen === false && "Has not previously raised this."}
                </p>
                <p className="text-xs text-muted mt-3">
                  Self-reported conversation, {card.date}. Not a diagnosis.
                </p>
              </div>
            )}

            {/* 5. What would help you */}
            {card.recommendations.length > 0 && (
              <div>
                <h2 className="text-sm font-medium mb-2">What would help you</h2>
                <ul className="text-[15px] leading-relaxed space-y-2">
                  {card.recommendations.map((rec) => (
                    <li key={rec.id} className="flex gap-2">
                      <span aria-hidden>☐</span>
                      <span>{rec.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Resources & community */}
            <div className="text-[15px] leading-relaxed">
              <h2 className="text-sm font-medium mb-2">Resources &amp; community</h2>
              <p className="text-rose font-medium">
                Understanding perimenopause, short guides &amp; support near you →
              </p>
              <p className="text-sm text-muted mt-1">
                Real stories, menopause cafés and online groups. You are not the
                only one experiencing this.
              </p>
            </div>

            {/* 7. Close */}
            <div className="text-center text-[15px] leading-relaxed border-t border-line pt-4">
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

          <div className="flex gap-3 print:hidden">
            <button
              type="button"
              onClick={downloadAsImage}
              disabled={downloading}
              className="rounded-full bg-rose hover:bg-rose-deep text-white px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {downloading ? "Preparing…" : "Download as image"}
            </button>
            <button
              type="button"
              onClick={copyAsText}
              className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors"
            >
              {copiedText ? "Copied ✓" : "Copy as text"}
            </button>
          </div>

          {result?.shareCard && (
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
                className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors print:hidden"
              >
                {copiedShare ? "Copied ✓" : "Copy to share"}
              </button>
            </Card>
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
