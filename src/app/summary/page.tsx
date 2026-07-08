"use client";

/**
 * Closing — her summary. Rules compute the signal (client-side, from the
 * session); Claude phrases the GP one-pager (wired in via /api/summary).
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, PartLabel, Question, Soft } from "@/components/ui";
import { computeRecognition, RecognitionResult } from "@/lib/recognition";
import { SessionData, deleteEverything, loadSession } from "@/lib/session";

export default function SummaryPage() {
  const [data, setData] = useState<SessionData | null>(null);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);

  useEffect(() => {
    const session = loadSession();
    setData(session);
    setRecognition(
      computeRecognition({
        menstrualChange: session.menstrualChange,
        impacts: session.impacts,
      }),
    );
  }, []);

  if (!data || !recognition) return null;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-xl flex items-center justify-between mb-6">
        <span className="font-medium tracking-wide">Constella</span>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete everything? No reason needed — it all goes.")) {
              deleteEverything();
              window.location.href = "/";
            }
          }}
          className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Delete everything
        </button>
      </header>

      <Card>
        <PartLabel>Your summary</PartLabel>
        <Question>Thank you. Here&apos;s what counts.</Question>
        <Soft>
          {recognition.level === "signal" &&
            "What you've described includes the kind of pattern that's genuinely worth exploring with a GP — a signal worth exploring, not a diagnosis."}
          {recognition.level === "ambiguous" &&
            "What you've described is real and worth taking seriously — these things have several possible causes, and a GP can help untangle them."}
          {recognition.level === "minimal" &&
            "You haven't flagged much today — and that's a perfectly good answer too."}
        </Soft>
        <p className="text-sm text-muted">
          GP-ready one-page summary generation coming next — this screen will
          hold it.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-sm text-rose underline underline-offset-4">
            Back to the start
          </Link>
        </div>
      </Card>
    </main>
  );
}
