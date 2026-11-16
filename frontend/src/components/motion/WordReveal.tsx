// A statement whose words ink in as it scrolls through the viewport (CSS scroll-driven
// animation; browsers without support simply show the finished text).
export default function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`ink-words ${className}`}>
      {text.split(" ").map((w, i) => <span key={i} className="inline-block pr-[0.25em]">{w}</span>)}
    </p>
  );
}
