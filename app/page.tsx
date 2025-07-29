import MatchResultInput from "./components/MatchResultInput";
import PlayerStatistics from "./components/PlayerStatistics";
import TeamMatches from "./components/TeamMatches";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tennis Team Stats</h1>
          <ThemeToggle />
        </div>

        <MatchResultInput />
        <br />
        <br />

        <PlayerStatistics />
        <br />
        <br />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <TeamMatches />
        </div>
      </main>
    </div>
  );
}
