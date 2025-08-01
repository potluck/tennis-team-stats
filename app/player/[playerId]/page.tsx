"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Player,
  MatchResult,
  PlayerStats as PlayerStatsType,
} from "@/app/lib/types";

function getMatchPoints(pos: number, isSingles: boolean): number {
  if (isSingles) {
    return pos === 1 ? 5 : 4;
  } else {
    return pos === 1 ? 5 : pos === 2 ? 4 : 3;
  }
}

export interface PlayerProfileProps {
  params: {
    playerId: string;
  };
}

const PlayerProfile = ({ params }: PlayerProfileProps) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const playerId = parseInt(params.playerId, 10);

        const [playersResponse, matchesResponse] = await Promise.all([
          fetch("/api/get-players"),
          fetch("/api/get-match-results"),
        ]);

        if (!playersResponse.ok || !matchesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const players = await playersResponse.json();
        const matches: MatchResult[] = await matchesResponse.json();

        const currentPlayer = players.find((p: Player) => p.id === playerId);
        if (!currentPlayer) {
          throw new Error("Player not found");
        }
        setPlayer(currentPlayer);

        const playerMatchHistory = matches.filter(
          (match) =>
            match.player1 === playerId || match.player2 === playerId
        );
        setMatchHistory(
          playerMatchHistory.sort(
            (a, b) =>
              new Date(b.match_date).getTime() -
              new Date(a.match_date).getTime()
          )
        );

        // Calculate stats
        const stats: PlayerStatsType = {
          id: currentPlayer.id,
          name: currentPlayer.name,
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
          pointsEarned: 0,
        };

        playerMatchHistory.forEach((match) => {
          if (match.incomplete_reason === "default") return;
          
          const points = getMatchPoints(match.pos, match.is_singles);
          stats.totalMatches++;

          if (match.result === "win") {
            stats.wins++;
            stats.pointsEarned += points;
            if (match.is_singles) {
              stats.singlesWins++;
            } else {
              stats.doublesWins++;
            }
          } else if (match.result === "loss") {
            stats.losses++;
            if (match.is_singles) {
              stats.singlesLosses++;
            } else {
              stats.doublesLosses++;
            }
          } else if (match.result === "tie") {
            stats.ties++;
            stats.pointsEarned += points / 2;
            if (match.is_singles) {
              stats.singlesTies++;
            } else {
              stats.doublesTies++;
            }
          }
        });
        
        const totalPoints = stats.wins + stats.ties * 0.5;
        stats.winPercentage = stats.totalMatches > 0 ? (totalPoints / stats.totalMatches) * 100 : 0;
        
        setPlayerStats(stats);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.playerId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center">
        <p className="text-muted-foreground">Loading player profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center">
        <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          &larr; Back to Stats
        </Link>
      </div>
    );
  }

  if (!player || !playerStats) {
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center">
        <p className="text-muted-foreground">Player not found.</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          &larr; Back to Stats
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/" className="text-primary hover:underline mb-4 block">
          &larr; Back to Team Stats
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">{player.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-background text-foreground rounded-lg border border-border p-6">
          <h2 className="text-2xl font-semibold mb-4">Overall Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
            <div><span className="font-semibold">Win %:</span> {playerStats.winPercentage.toFixed(1)}%</div>
            <div><span className="font-semibold">Points:</span> {playerStats.pointsEarned}</div>
            <div><span className="font-semibold">Record:</span> {playerStats.wins}-{playerStats.losses}-{playerStats.ties}</div>
            <div><span className="font-semibold">Matches:</span> {playerStats.totalMatches}</div>
          </div>
        </div>
        <div className="bg-background text-foreground rounded-lg border border-border p-6">
          <h2 className="text-2xl font-semibold mb-4">Discipline Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
            <div><span className="font-semibold">Singles:</span> {playerStats.singlesWins}-{playerStats.singlesLosses}-{playerStats.singlesTies}</div>
            <div><span className="font-semibold">Doubles:</span> {playerStats.doublesWins}-{playerStats.doublesLosses}-{playerStats.doublesTies}</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Match History</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Opponent</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold hidden md:table-cell">Partner</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Result</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matchHistory.map((match) => (
                <tr key={match.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">{new Date(match.match_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm">{match.opponent_name}</td>
                  <td className="px-4 py-3 text-xs sm:text-sm hidden md:table-cell">
                    {match.is_singles
                      ? "N/A"
                      : match.player1 === player.id
                      ? match.player2_name
                      : match.player1_name}
                  </td>
                  <td className={`px-4 py-3 text-xs sm:text-sm font-medium capitalize ${
                    match.result === "win" ? "text-primary" :
                    match.result === "loss" ? "text-destructive" : ""
                  }`}>
                    {match.result}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
                    {match.set1score}, {match.set2score}
                    {match.set3score && `, ${match.set3score}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile; 