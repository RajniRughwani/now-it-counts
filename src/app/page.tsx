import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="gentle-in max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted mb-4">Now It Counts</p>
        <h1 className="text-3xl sm:text-5xl font-medium leading-tight mb-4">
          You&apos;ve been describing this for years.
          <br />
          <span className="text-rose">Now it counts.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted leading-relaxed mb-10">
          A gentle, unhurried conversation about how you&apos;ve really been —
          ending in a one-page summary you own, ready for whoever you trust.
          Not a diagnosis. Not a tracker. Just your story, taken seriously.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/session"
            className="rounded-full bg-rose hover:bg-rose-deep text-white px-8 py-4 text-base font-medium transition-colors"
          >
            💬 &nbsp;Start with text
          </Link>
          <Link
            href="/voice"
            className="rounded-full border border-rose text-rose hover:bg-rose-mist px-8 py-4 text-base font-medium transition-colors"
          >
            🎙️ &nbsp;Talk instead
          </Link>
        </div>

        <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
          We collect the minimum, we ask permission for everything, we keep no
          audio, and you can delete it all with one tap. Every question is
          optional.
        </p>
      </div>
    </main>
  );
}
