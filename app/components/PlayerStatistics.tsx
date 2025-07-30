"use client";

import { useState, useEffect } from "react";

interface Team {
  id: number;
  name: string;
}

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
  pointsEarned: number;
}

interface PairStats {
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winPercentage: number;
  pointsEarned: number;
}

type ViewMode = "all" | "singles" | "doubles";

function getMatchPoints(pos: number, isSingles: boolean): number {
  if (isSingles) {
    return pos === 1 ? 5 : 4;
  } else {
    return pos === 1 ? 5 : pos === 2 ? 4 : 3;
  }
}

export default function PlayerStatistics() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [pairStats, setPairStats] = useState<PairStats[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [playersResponse, matchesResponse, teamsResponse] = await Promise.all([
          fetch("/api/get-players"),
          fetch("/api/get-match-results"),
          fetch("/api/get-teams")
        ]);

        if (!playersResponse.ok || !matchesResponse.ok || !teamsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [playersData, matchesData, teamsData] = await Promise.all([
          playersResponse.json(),
          matchesResponse.json(),
          teamsResponse.json()
        ]);

        // Get the first team's name (assuming we're only dealing with one team for now)
        const team = teamsData.find((t: Team) => t.id === 1);
        setTeamName(team?.name || "Team");
        
        setMatchResults(matchesData);
        calculatePlayerStats(matchesData);
        calculatePairStats(matchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
          pointsEarned: 0
        });
      }
    };

    // Process each match result
    results.forEach((result) => {
      // Skip matches that don't match the current view mode
      if (viewMode === "singles" && !result.is_singles) return;
      if (viewMode === "doubles" && result.is_singles) return;

      // Initialize player1
      initializePlayer(result.player1, result.player1_name);
      const player1Stats = statsMap.get(result.player1)!;

      // Update player1 stats
      player1Stats.totalMatches++;
      const points = getMatchPoints(result.pos, result.is_singles);

      if (result.result === "win") {
        player1Stats.wins++;
        player1Stats.pointsEarned += points;
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
        player1Stats.pointsEarned += points / 2;
        if (result.is_singles) {
          player1Stats.singlesTies++;
        } else {
          player1Stats.doublesTies++;
        }
      }

      // If doubles match, update player2 stats
      if (!result.is_singles && result.player2 && result.player2_name) {
        initializePlayer(result.player2, result.player2_name);
        const player2Stats = statsMap.get(result.player2)!;

        player2Stats.totalMatches++;
        if (result.result === "win") {
          player2Stats.wins++;
          player2Stats.doublesWins++;
          player2Stats.pointsEarned += points;
        } else if (result.result === "loss") {
          player2Stats.losses++;
          player2Stats.doublesLosses++;
        } else if (result.result === "tie") {
          player2Stats.ties++;
          player2Stats.doublesTies++;
          player2Stats.pointsEarned += points / 2;
        }
      }
    });

    // Calculate win percentages and filter based on view mode
    const statsArray = Array.from(statsMap.values())
      .map(stats => {
        const relevantWins = viewMode === "singles" ? stats.singlesWins :
                           viewMode === "doubles" ? stats.doublesWins :
                           stats.wins;
        const relevantLosses = viewMode === "singles" ? stats.singlesLosses :
                             viewMode === "doubles" ? stats.doublesLosses :
                             stats.losses;
        const relevantTies = viewMode === "singles" ? stats.singlesTies :
                           viewMode === "doubles" ? stats.doublesTies :
                           stats.ties;
        const totalMatches = relevantWins + relevantLosses + relevantTies;
        const totalPoints = relevantWins + relevantTies * 0.5;
        
        return {
          ...stats,
          totalMatches,
          winPercentage: totalMatches > 0 ? (totalPoints / totalMatches) * 100 : 0
        };
      })
      .filter(stats => stats.totalMatches > 0)
      .sort((a, b) => {
        if (b.pointsEarned !== a.pointsEarned) {
          return b.pointsEarned - a.pointsEarned;
        }
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        return b.totalMatches - a.totalMatches;
      });

    setPlayerStats(statsArray);
  };

  const calculatePairStats = (results: MatchResult[]) => {
    const pairsMap = new Map<string, PairStats>();

    // Process only doubles matches
    results
      .filter(result => !result.is_singles && result.player2 !== null && result.player2_name !== null)
      .forEach(result => {
        const key = [result.player1, result.player2!].sort((a, b) => a - b).join('-');
        
        if (!pairsMap.has(key)) {
          pairsMap.set(key, {
            player1Id: Math.min(result.player1, result.player2!),
            player2Id: Math.max(result.player1, result.player2!),
            player1Name: result.player1_name,
            player2Name: result.player2_name!,
            wins: 0,
            losses: 0,
            ties: 0,
            totalMatches: 0,
            winPercentage: 0,
            pointsEarned: 0
          });
        }

        const stats = pairsMap.get(key)!;
        stats.totalMatches++;

        if (result.result === "win") {
          stats.wins++;
          stats.pointsEarned += getMatchPoints(result.pos, false);
        } else if (result.result === "loss") {
          stats.losses++;
        } else if (result.result === "tie") {
          stats.ties++;
          stats.pointsEarned += getMatchPoints(result.pos, false) / 2;
        }

        // Calculate win percentage
        const totalPoints = stats.wins + stats.ties * 0.5;
        stats.winPercentage = (totalPoints / stats.totalMatches) * 100;
      });

    const statsArray = Array.from(pairsMap.values()).sort((a, b) => {
      if (b.pointsEarned !== a.pointsEarned) {
        return b.pointsEarned - a.pointsEarned;
      }
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.totalMatches - a.totalMatches;
    });

    setPairStats(statsArray);
  };

  useEffect(() => {
    // Recalculate stats when view mode changes
    if (matchResults.length > 0) {
      calculatePlayerStats(matchResults);
    }
  }, [viewMode, matchResults]);

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
    } catch {
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
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-primary mb-2">{teamName}</h2>
        <div className="h-1 w-20 bg-primary rounded"></div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold">
          {viewMode === "doubles" ? "Doubles Statistics" :
           viewMode === "singles" ? "Singles Statistics" :
           "Player Statistics"}
        </h3>
        <div className="flex p-0.5 bg-secondary rounded-lg">
          {(["all", "singles", "doubles"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-md transition-colors capitalize ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary/80"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {playerStats.length === 0 ? (
        <p className="text-muted-foreground">No match results found.</p>
      ) : viewMode === "doubles" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-secondary">
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold">
                  Pair
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
                  Points Earned
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pairStats.map((pair) => (
                <tr
                  key={`${pair.player1Id}-${pair.player2Id}`}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {pair.player1Name} / {pair.player2Name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {pair.totalMatches}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {pair.wins}-{pair.losses}-{pair.ties}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        pair.winPercentage >= 70
                          ? "text-primary"
                          : pair.winPercentage >= 50
                          ? "dark:text-orange-400 text-orange-500"
                          : "text-destructive"
                      }`}
                    >
                      {pair.winPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {pair.pointsEarned}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  Points Earned
                </th>
                {viewMode === "all" && (
                  <>
                    <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                      Singles
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                      Doubles
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {playerStats.map((player) => (
                <tr key={player.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                    {player.totalMatches}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {viewMode === "singles" 
                      ? `${player.singlesWins}-${player.singlesLosses}-${player.singlesTies}`
                      : viewMode === "doubles"
                      ? `${player.doublesWins}-${player.doublesLosses}-${player.doublesTies}`
                      : `${player.wins}-${player.losses}-${player.ties}`}
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
                    {player.pointsEarned}
                  </td>
                  {viewMode === "all" && (
                    <>
                      <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                        {player.singlesWins}-{player.singlesLosses}-{player.singlesTies}
                      </td>
                      <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                        {player.doublesWins}-{player.doublesLosses}-{player.doublesTies}
                      </td>
                    </>
                  )}
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
            {viewMode === "singles" ? "Singles Matches" :
             viewMode === "doubles" ? "Doubles Matches" :
             "Total Matches"}
          </h3>
          <p className="text-3xl font-bold text-primary">
            {viewMode === "singles" 
              ? matchResults.filter(m => m.is_singles).length
              : viewMode === "doubles"
              ? matchResults.filter(m => !m.is_singles).length
              : matchResults.length}
          </p>
        </div>
        <div className="bg-secondary rounded-lg p-6 border border-border">
          <h3 className="text-lg font-medium mb-2">
            {viewMode === "doubles" ? "Active Pairs" : "Active Players"}
          </h3>
          <p className="text-3xl font-bold text-primary">
            {viewMode === "doubles" ? pairStats.length : playerStats.length}
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
