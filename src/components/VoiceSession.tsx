"use client";

/**
 * Voice conversation via ElevenLabs. Text flow remains the demo backbone;
 * this is the spoken option promised on the landing page. On end, the full
 * transcript is extracted into the same structured shape the text flow
 * produces, then handed to the same /summary page + safety-gated
 * recognition rules — one downstream path for both entry points.
 */

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Card, PartLabel, PrimaryButton, Question, Soft } from "@/components/ui";
import { saveSession } from "@/lib/session";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

interface TranscriptTurn {
  role: "user" | "ai";
  text: string;
}

export default function VoiceSession() {
  return (
    <ConversationProvider>
      <VoiceSessionInner />
    </ConversationProvider>
  );
}

function VoiceSessionInner() {
  const router = useRouter();
  const [micError, setMicError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [captions, setCaptions] = useState<TranscriptTurn[]>([]);
  const transcriptRef = useRef<TranscriptTurn[]>([]);

  const conversation = useConversation({
    onError: (message) => setMicError(message),
    onMessage: ({ message, source }) => {
      const turn: TranscriptTurn = { role: source, text: message };
      transcriptRef.current = [...transcriptRef.current, turn];
      setCaptions((c) => [...c.slice(-3), turn]); // keep last few lines visible
    },
  });

  const finish = useCallback(async () => {
    setFinishing(true);
    const transcript = transcriptRef.current;
    if (transcript.length === 0) {
      router.push("/");
      return;
    }
    try {
      const res = await fetch("/api/voice-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        router.push("/");
        return;
      }
      saveSession(data);
      router.push("/summary");
    } catch {
      router.push("/");
    }
  }, [router]);

  const start = useCallback(async () => {
    setMicError(null);
    transcriptRef.current = [];
    setCaptions([]);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!AGENT_ID) {
        setMicError("Voice agent isn't configured yet.");
        return;
      }
      await conversation.startSession({ agentId: AGENT_ID, connectionType: "webrtc" });
    } catch {
      setMicError("We need microphone access to start. Please allow it and try again.");
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    finish();
  }, [conversation, finish]);

  const { status, isSpeaking } = conversation;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Card>
        <PartLabel>Talk it through</PartLabel>

        {status === "disconnected" && !finishing && (
          <>
            <Question>Whenever you&apos;re ready, just say hello.</Question>
            <Soft>
              This is a spoken version of the same gentle conversation — about
              six minutes, every question optional, nothing kept after you
              finish. You&apos;ll need to allow microphone access.
            </Soft>
            <PrimaryButton onClick={start}>🎙️ Start talking</PrimaryButton>
            {micError && <p className="text-sm text-rose-deep mt-3">{micError}</p>}
          </>
        )}

        {status === "connecting" && (
          <>
            <Question>Connecting…</Question>
            <div className="flex gap-1.5 mt-2" aria-label="connecting">
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:300ms]" />
            </div>
          </>
        )}

        {status === "connected" && (
          <>
            <Question>{isSpeaking ? "Speaking…" : "Listening…"}</Question>
            <Soft>Talk naturally — skip anything, or just say you&apos;d rather stop.</Soft>

            <div className="relative mx-auto my-6 w-24 h-24" aria-hidden>
              {isSpeaking && (
                <span className="absolute inset-0 rounded-full bg-rose orb-ring" />
              )}
              <div
                className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                  isSpeaking ? "bg-rose orb-speaking" : "bg-rose-soft orb-listening"
                }`}
              />
            </div>

            {/* Live captions — visible proof it's working, per team feedback */}
            <div className="min-h-[4.5rem] w-full text-sm leading-relaxed text-left space-y-1 mb-4">
              {captions.length === 0 && (
                <p className="text-muted italic">Listening for your voice…</p>
              )}
              {captions.map((c, i) => (
                <p
                  key={i}
                  className={`gentle-in ${
                    c.role === "ai" ? "text-foreground" : "text-rose-deep font-medium"
                  }`}
                >
                  {c.text}
                </p>
              ))}
            </div>

            <button
              type="button"
              onClick={stop}
              className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors"
            >
              End conversation
            </button>

            <p className="text-xs text-muted mt-4">
              🔒 Nothing is recorded — only used to write your summary when you finish.
            </p>
          </>
        )}

        {finishing && (
          <>
            <Question>Putting your words into one page…</Question>
            <Soft>One moment — taking you to your summary.</Soft>
            <div className="flex gap-1.5 mt-2" aria-label="loading">
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-rose animate-bounce [animation-delay:300ms]" />
            </div>
          </>
        )}

        {status === "error" && !finishing && (
          <>
            <Question>Something interrupted the call.</Question>
            <Soft>Nothing you said has been kept anywhere. You can try again.</Soft>
            <PrimaryButton onClick={start}>Try again</PrimaryButton>
          </>
        )}
      </Card>
    </main>
  );
}
