import Teams from "./components/Teams";
import Players from "./components/Players";
import TeamMatches from "./components/TeamMatches";
import MatchResultInput from "./components/MatchResultInput";

export default function Home() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Tennis Team Stats
        </h1>

        <MatchResultInput />
        <br />
        <br />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <TeamMatches />
        </div>
      </main>
    </div>
  );
}
