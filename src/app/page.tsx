import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="gentle-in max-w-xl text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-muted mb-4">
          Your story matters
        </p>
        <h1 className="mb-4">
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.15]">
            You&apos;ve been trying to make sense of it for years.
          </span>
          <span className="block text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-rose leading-snug mt-3">
            Could your symptoms be connected?
          </span>
        </h1>
        <p className="text-base sm:text-lg text-muted leading-relaxed mb-10">
          A gentle, unhurried conversation about how you&apos;ve really been,
          leading to a better outcome you can share with whoever you trust.
          Not a diagnosis. Not a tracker. Just your story, taken seriously.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/session"
            className="rounded-full bg-rose hover:bg-rose-deep text-white px-8 py-4 text-base font-medium transition-colors w-full sm:w-auto"
          >
            💬 &nbsp;Start with text
          </Link>
          <Link
            href="/voice"
            className="rounded-full border border-rose text-rose hover:bg-rose-mist px-8 py-4 text-base font-medium transition-colors w-full sm:w-auto"
          >
            🎙️ &nbsp;Talk instead
          </Link>
        </div>

        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
          We collect the minimum, we ask permission for everything, we keep no
          audio, and you can delete it all with one tap. Every question is
          optional.
        </p>
      </div>
    </main>
  );
}
