"use client";

import { useState, useEffect } from "react";

interface MatchResult {
  id: number;
  team_match_id: number;
  is_singles: boolean;
  pos: number;
  player1: number;
  player2: number | null;
  result: "win" | "loss" | "tie";
  set1score: string;
  set2score: string;
  set3score: string | null;
  incomplete_reason: string | null;
  player1_name: string;
  player2_name: string | null;
  match_date: string;
  opponent_name: string;
}

interface PlayerStats {
  id: number;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winPercentage: number;
  singlesWins: number;
  singlesLosses: number;
  singlesTies: number;
  doublesWins: number;
  doublesLosses: number;
  doublesTies: number;
}

export default function PlayerStatistics() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatchResults() {
      try {
        const response = await fetch("/api/get-match-results");
        if (!response.ok) {
          throw new Error("Failed to fetch match results");
        }
        const data = await response.json();
        setMatchResults(data);
        calculatePlayerStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMatchResults();
  }, []);

  const calculatePlayerStats = (results: MatchResult[]) => {
    const statsMap = new Map<number, PlayerStats>();

    // Initialize stats for each player
    const initializePlayer = (id: number, name: string) => {
      if (!statsMap.has(id)) {
        statsMap.set(id, {
          id,
          name,
          wins: 0,
          losses: 0,
          ties: 0,
          totalMatches: 0,
          winPercentage: 0,
          singlesWins: 0,
          singlesLosses: 0,
          singlesTies: 0,
          doublesWins: 0,
          doublesLosses: 0,
          doublesTies: 0,
        });
      }
    };

    // Process each match result
    results.forEach((result) => {
      // Initialize player1
      initializePlayer(result.player1, result.player1_name);
      const player1Stats = statsMap.get(result.player1)!;

      // Update player1 stats
      player1Stats.totalMatches++;
      if (result.result === "win") {
        player1Stats.wins++;
        if (result.is_singles) {
          player1Stats.singlesWins++;
        } else {
          player1Stats.doublesWins++;
        }
      } else if (result.result === "loss") {
        player1Stats.losses++;
        if (result.is_singles) {
          player1Stats.singlesLosses++;
        } else {
          player1Stats.doublesLosses++;
        }
      } else if (result.result === "tie") {
        player1Stats.ties++;
        if (result.is_singles) {
          player1Stats.singlesTies++;
        } else {
          player1Stats.doublesTies++;
        }
      }

      // If doubles match, update player2 stats as well
      if (!result.is_singles && result.player2 && result.player2_name) {
        initializePlayer(result.player2, result.player2_name);
        const player2Stats = statsMap.get(result.player2)!;

        player2Stats.totalMatches++;
        if (result.result === "win") {
          player2Stats.wins++;
          player2Stats.doublesWins++;
        } else if (result.result === "loss") {
          player2Stats.losses++;
          player2Stats.doublesLosses++;
        } else if (result.result === "tie") {
          player2Stats.ties++;
          player2Stats.doublesTies++;
        }
      }
    });

    // Calculate win percentages (ties count as half wins)
    statsMap.forEach((stats) => {
      const totalMatches = stats.wins + stats.losses + stats.ties;
      const totalPoints = stats.wins + stats.ties * 0.5;
      stats.winPercentage =
        totalMatches > 0 ? (totalPoints / totalMatches) * 100 : 0;
    });

    // Convert to array and sort by win percentage, then by total matches
    const statsArray = Array.from(statsMap.values()).sort((a, b) => {
      // Primary sort: by win percentage (descending)
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      // Secondary sort: by total matches (descending)
      return b.totalMatches - a.totalMatches;
    });

    setPlayerStats(statsArray);
  };

  const formatMatchDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return new Date(date.getTime() + 12 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Player Statistics</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Player Statistics</h2>
        <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">Player Statistics</h2>

      {playerStats.length === 0 ? (
        <p className="text-muted-foreground">No match results found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-secondary">
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold">
                  Player
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  Matches
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  W-L-T
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  Win %
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  Singles
                </th>
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  Doubles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {playerStats.map((player) => (
                <tr
                  key={player.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {player.totalMatches}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {player.wins}-{player.losses}-{player.ties}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        player.winPercentage >= 70
                          ? "text-primary"
                          : player.winPercentage >= 50
                          ? "dark:text-orange-400 text-orange-500"
                          : "text-destructive"
                      }`}
                    >
                      {player.winPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {player.singlesWins}-{player.singlesLosses}-
                    {player.singlesTies}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {player.doublesWins}-{player.doublesLosses}-
                    {player.doublesTies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium mb-2">
            Total Matches
          </h3>
          <p className="text-3xl font-bold text-primary">
            {matchResults.length}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium mb-2">
            Active Players
          </h3>
          <p className="text-3xl font-bold text-primary">
            {playerStats.length}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium mb-2">
            Recent Activity
          </h3>
          <p className="text-lg text-muted-foreground">
            {matchResults.length > 0
              ? `Last match: ${formatMatchDate(matchResults[0]?.match_date)}`
              : "No matches yet"}
          </p>
        </div>
      </div>
    </div>
  );
}
