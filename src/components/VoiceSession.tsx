"use client";

/**
 * Voice conversation with Constella via ElevenLabs. Text flow remains the
 * demo backbone; this is the voice option promised on the landing page.
 */

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";
import { Card, PartLabel, PrimaryButton, Question, Soft } from "@/components/ui";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export default function VoiceSession() {
  return (
    <ConversationProvider>
      <VoiceSessionInner />
    </ConversationProvider>
  );
}

function VoiceSessionInner() {
  const [micError, setMicError] = useState<string | null>(null);
  const conversation = useConversation({
    onError: (message) => setMicError(message),
  });

  const start = useCallback(async () => {
    setMicError(null);
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

  const stop = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const { status, isSpeaking } = conversation;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Card>
        <PartLabel>Talk to Constella</PartLabel>

        {status === "disconnected" && (
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
            <Question>{isSpeaking ? "Constella is speaking…" : "Listening…"}</Question>
            <Soft>Talk naturally — skip anything, or just say you&apos;d rather stop.</Soft>
            <div
              className={`mx-auto my-6 w-24 h-24 rounded-full transition-all duration-300 ${
                isSpeaking ? "bg-rose scale-110" : "bg-rose-soft scale-100"
              }`}
              aria-hidden
            />
            <button
              type="button"
              onClick={stop}
              className="rounded-full border border-rose text-rose hover:bg-rose-mist px-6 py-3 text-sm font-medium transition-colors"
            >
              End conversation
            </button>
          </>
        )}

        {status === "error" && (
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
