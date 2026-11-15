import Link from "next/link";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="grid-paper flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="OSAKA TOOL home"><Logo /></Link>
      <p className="mt-16 font-mono text-sm tracking-[0.3em] text-beni">ERROR 404 · OUT OF RANGE</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Reading off the scale.</h1>
      <p className="mt-5 max-w-md text-mute">The page you requested does not exist or has moved. Try the catalogue or search for a model number.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn btn-primary">Browse products</Link>
        <Link href="/" className="btn btn-ghost">Home</Link>
      </div>
    </div>
  );
}
