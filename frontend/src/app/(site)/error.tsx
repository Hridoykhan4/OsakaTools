"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm tracking-[0.3em] text-beni">TEMPORARY FAULT</p>
      <h1 className="mt-4 text-4xl font-semibold">Something interrupted this page.</h1>
      <p className="mt-4 max-w-md text-mute">Please try again. If the problem continues, contact us and we will help directly.</p>
      <button onClick={reset} className="btn btn-primary mt-8">Try again</button>
    </div>
  );
}
