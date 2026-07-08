"use client";

/** Small warm UI primitives shared across the flow. */

import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="gentle-in w-full max-w-xl rounded-3xl bg-card border border-line shadow-[0_2px_24px_rgba(180,140,120,0.08)] p-6 sm:p-8">
      {children}
    </div>
  );
}

export function PartLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-muted mb-3">{children}</p>
  );
}

/** Shows how close to the end she is — reduces drop-off before the equity questions. */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full max-w-xl mb-3 gentle-in">
      <div className="flex justify-between text-xs text-muted mb-1.5">
        <span>
          Part {current} of {total}
        </span>
        <span>{current === total ? "Almost done" : `~${(total - current) * 45} sec left`}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full bg-rose transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function Question({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-medium leading-snug mb-2">
      {children}
    </h2>
  );
}

export function Soft({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted leading-relaxed mb-4">{children}</p>;
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm sm:text-base border transition-colors text-left ${
        selected
          ? "bg-rose text-white border-rose"
          : "bg-rose-mist border-rose-soft hover:border-rose"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-rose hover:bg-rose-deep disabled:opacity-40 text-white px-6 py-3 text-base font-medium transition-colors"
    >
      {children}
    </button>
  );
}

/** Every question is optional — skipping is graceful, never asked twice. */
export function SkipLink({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-muted underline underline-offset-4 hover:text-foreground transition-colors"
    >
      {label ?? "Skip this one"}
    </button>
  );
}
