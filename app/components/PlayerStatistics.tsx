"use client";

import { useState, useEffect, useCallback } from "react";

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
type SortField = "points" | "winPercentage";
type SortDirection = "asc" | "desc";

function getMatchPoints(pos: number, isSingles: boolean): number {
  if (isSingles) {
    return pos === 1 ? 5 : 4;
  } else {
    return pos === 1 ? 5 : pos === 2 ? 4 : 3;
  }
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 ml-1 inline-block transition-transform ${
        direction === "asc" ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PlayerStatistics() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [pairStats, setPairStats] = useState<PairStats[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      // If clicking a new field, set it with default desc direction
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const calculatePlayerStats = useCallback((results: MatchResult[]) => {
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

      // Skip defaulted matches for win percentage calculation
      if (result.incomplete_reason === "default") return;

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
    const statsArray = sortStats(
      Array.from(statsMap.values())
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
        .filter(stats => stats.totalMatches > 0),
      sortField,
      sortDirection
    );

    setPlayerStats(statsArray);
  }, [viewMode, sortField, sortDirection]);

  const calculatePairStats = useCallback((results: MatchResult[]) => {
    const pairsMap = new Map<string, PairStats>();

    // Process only doubles matches
    results
      .filter(result => !result.is_singles && result.player2 !== null && result.player2_name !== null)
      // Skip defaulted matches
      .filter(result => result.incomplete_reason !== "default")
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

    const statsArray = sortStats(Array.from(pairsMap.values()), sortField, sortDirection);
    setPairStats(statsArray);
  }, [sortField, sortDirection]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesResponse, teamsResponse] = await Promise.all([
          fetch("/api/get-match-results"),
          fetch("/api/get-teams")
        ]);

        if (!matchesResponse.ok || !teamsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [matchesData, teamsData] = await Promise.all([
          matchesResponse.json(),
          teamsResponse.json()
        ]);

        const team = teamsData.find((t: Team) => t.id === 1);
        setTeamName(team?.name || "Team");
        
        calculatePlayerStats(matchesData);
        calculatePairStats(matchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [calculatePlayerStats, calculatePairStats]);

  const sortStats = <T extends { pointsEarned: number; winPercentage: number; totalMatches: number }>(
    stats: T[],
    field: SortField,
    direction: SortDirection
  ): T[] => {
    return [...stats].sort((a, b) => {
      let comparison = 0;
      
      if (field === "points") {
        comparison = b.pointsEarned - a.pointsEarned;
      } else {
        comparison = b.winPercentage - a.winPercentage;
      }

      // If primary sort is equal, use secondary sort
      if (comparison === 0) {
        if (field === "points") {
          comparison = b.winPercentage - a.winPercentage;
        } else {
          comparison = b.pointsEarned - a.pointsEarned;
        }
      }

      // If still equal, sort by matches
      if (comparison === 0) {
        comparison = b.totalMatches - a.totalMatches;
      }

      return direction === "desc" ? comparison : -comparison;
    });
  };



  const getDisplayScore = useCallback((player: PlayerStats) => {
    switch (viewMode) {
      case "singles":
        return `${player.singlesWins}-${player.singlesLosses}-${player.singlesTies}`;
      case "doubles":
        return `${player.doublesWins}-${player.doublesLosses}-${player.doublesTies}`;
      case "all":
        return `${player.wins}-${player.losses}-${player.ties}`;
    }
  }, [viewMode]);

  const renderSortableHeader = (title: string, field: SortField) => (
    <th 
      scope="col" 
      className={`px-6 py-4 text-center text-sm cursor-pointer hover:text-primary transition-colors ${
        sortField === field ? "text-primary font-bold" : "font-semibold"
      }`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        {title}
        {sortField === field && <SortIcon direction={sortDirection} />}
      </div>
    </th>
  );

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
    <div className="bg-background text-foreground rounded-lg border border-border p-6 mt-4">
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-primary mb-2">{teamName}</h2>
        <div className="h-1 w-20 bg-primary rounded"></div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-semibold">
            {viewMode === "doubles" ? "Doubles Stats" :
             viewMode === "singles" ? "Singles Stats" :
             "Player Stats"}
          </h3>
        </div>
        <div className="flex p-0.5 bg-secondary rounded-lg">
          {(["all", "singles", "doubles"] as const).map((mode) => (
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
                {renderSortableHeader("Points", "points")}
                {renderSortableHeader("Win %", "winPercentage")}
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  W-L-T
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
                  <td className={`px-6 py-4 text-sm text-center font-medium whitespace-nowrap ${
                    sortField === "points" ? "font-bold" : ""
                  }`}>
                    {pair.pointsEarned}
                  </td>
                  <td className={`px-6 py-4 text-sm text-center whitespace-nowrap ${
                    sortField === "winPercentage" ? "font-bold" : ""
                  }`}>
                    <span
                      className={`${
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
                    {pair.wins}-{pair.losses}-{pair.ties}
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
                {renderSortableHeader("Points", "points")}
                {renderSortableHeader("Win %", "winPercentage")}
                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold">
                  W-L-T
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {playerStats.map((player) => (
                <tr key={player.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-medium whitespace-nowrap">
                    {player.pointsEarned}
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
                    {getDisplayScore(player)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
}

