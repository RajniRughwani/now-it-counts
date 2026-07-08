"use client";

/**
 * Closing — her record. "You've been describing this for years. Now it counts."
 * Rules computed the signal during the session; Claude phrases the one-pager
 * via /api/summary. Session data never persists beyond this browser session.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card, PartLabel, Question, Soft } from "@/components/ui";
import { RecognitionResult } from "@/lib/recognition";
import { deleteEverything, loadSession } from "@/lib/session";

interface SummaryResponse {
  gpSummary?: string;
  shareCard?: string;
  recognition: RecognitionResult;
  error?: string;
}

export default function SummaryPage() {
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const requested = useRef(false);

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
        const body = (await r.json()) as SummaryResponse;
        if (!r.ok || body.error) setFailed(true);
        setResult(body);
      })
      .catch(() => setFailed(true));
  }, []);

  const onDelete = () => {
    if (confirm("Delete everything? No reason needed — it all goes.")) {
      deleteEverything();
      window.location.href = "/";
    }
  };

  const copyShareCard = async () => {
    if (!result?.shareCard) return;
    await navigator.clipboard.writeText(result.shareCard);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 gap-6">
      <header className="w-full max-w-xl flex items-center justify-between print:hidden">
        <span className="font-medium tracking-wide">Constella</span>
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
            Written in language any healthcare professional will recognise —
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
            Nothing you shared has been lost from this session — and nothing has
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

      {result?.gpSummary && (
        <>
          <Card>
            <PartLabel>Your record — yours to keep</PartLabel>
            <article className="prose-sm max-w-none [&_h1]:text-xl [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:leading-relaxed [&_p]:mb-3 [&_li]:leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-rose [&_blockquote]:pl-3 [&_blockquote]:italic">
              <Markdown text={result.gpSummary} />
            </article>
            <div className="flex gap-3 mt-6 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-rose hover:bg-rose-deep text-white px-6 py-3 text-sm font-medium transition-colors"
              >
                Print / save as PDF
              </button>
            </div>
          </Card>

          {result.shareCard && (
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
                {copied ? "Copied ✓" : "Copy to share"}
              </button>
            </Card>
          )}

          <p className="text-center text-sm text-muted max-w-md print:hidden">
            You&apos;ve been describing this for years.{" "}
            <span className="text-rose font-medium">Now it counts.</span>
          </p>
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

/** Tiny markdown renderer — headings, bold, blockquotes, lists. No deps. */
function Markdown({ text }: { text: string }) {
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*] (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="list-disc ml-5 mb-3">${m}</ul>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split(/\n{2,}/)
    .map((block) =>
      block.trim().startsWith("<") ? block : `<p>${block.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
