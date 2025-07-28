"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  name: string;
  team_id: number;
}

interface TeamMatch {
  id: number;
  date: string;
  opponent_name: string;
}

export default function MatchResultInput() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [teamMatchId, setTeamMatchId] = useState<number | "">("");
  const [isSingles, setIsSingles] = useState(true);
  const [pos, setPos] = useState<number | "">(1);
  const [player1, setPlayer1] = useState<number | "">("");
  const [player2, setPlayer2] = useState<number | "">("");
  const [result, setResult] = useState<string>("win");
  const [set1Score, setSet1Score] = useState("");
  const [set2Score, setSet2Score] = useState("");
  const [set3Score, setSet3Score] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [playersResponse, matchesResponse] = await Promise.all([
          fetch("/api/get-players"),
          fetch("/api/get-team-matches"),
        ]);

        if (!playersResponse.ok || !matchesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const playersData = await playersResponse.json();
        const matchesData = await matchesResponse.json();

        // Filter players for team ID 1
        const team1Players = playersData.filter(
          (player: Player) => player.team_id === 1
        );

        setPlayers(team1Players);
        setTeamMatches(matchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/insert-match-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_match_id: teamMatchId,
          is_singles: isSingles,
          pos,
          player1,
          player2: isSingles ? null : player2,
          result,
          set1score: set1Score,
          set2score: set2Score,
          set3score: set3Score || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit match result");
      }

      setSuccess("Match result submitted successfully!");

      // Reset form
      setTeamMatchId("");
      setPos(1);
      setPlayer1("");
      setPlayer2("");
      setResult("win");
      setSet1Score("");
      setSet2Score("");
      setSet3Score("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Input Match Results</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Input Match Results</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Match Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Match
          </label>
          <select
            value={teamMatchId}
            onChange={(e) => setTeamMatchId(Number(e.target.value) || "")}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a match</option>
            {teamMatches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.date} vs {match.opponent_name}
              </option>
            ))}
          </select>
        </div>

        {/* Singles/Doubles Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Match Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={isSingles}
                onChange={() => {
                  setIsSingles(true);
                  setPlayer2("");
                }}
                className="mr-2"
              />
              Singles
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isSingles}
                onChange={() => setIsSingles(false)}
                className="mr-2"
              />
              Doubles
            </label>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <select
            value={pos}
            onChange={(e) => setPos(Number(e.target.value) || "")}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        {/* Player 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player 1
          </label>
          <select
            value={player1}
            onChange={(e) => setPlayer1(Number(e.target.value) || "")}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {/* Player 2 (for doubles) */}
        {!isSingles && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player 2
            </label>
            <select
              value={player2}
              onChange={(e) => setPlayer2(Number(e.target.value) || "")}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a player</option>
              {players
                .filter((p) => p.id !== player1)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Result */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result
          </label>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="win">Win</option>
            <option value="tie">Tie</option>
            <option value="loss">Loss</option>
          </select>
        </div>

        {/* Set Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set 1 Score *
            </label>
            <input
              type="text"
              value={set1Score}
              onChange={(e) => setSet1Score(e.target.value)}
              placeholder="e.g., 7-5"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set 2 Score *
            </label>
            <input
              type="text"
              value={set2Score}
              onChange={(e) => setSet2Score(e.target.value)}
              placeholder="e.g., 6-4"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set 3 Score
            </label>
            <input
              type="text"
              value={set3Score}
              onChange={(e) => setSet3Score(e.target.value)}
              placeholder="e.g., 6-2"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Match Result"}
        </button>
      </form>
    </div>
  );
}
