import MatchResultInput from "../components/MatchResultInput";
import { ThemeToggle } from "../components/ThemeToggle";
import Link from "next/link";

export default function EnterMatch() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <Link 
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Enter Match Result</h1>
          </div>
          <ThemeToggle />
        </div>

        <MatchResultInput />
      </main>
    </div>
  );
} 