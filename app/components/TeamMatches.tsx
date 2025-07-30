"use client";

import { useState, useEffect } from "react";

interface TeamMatch {
  id: number;
  opponent_name: string;
  team_id: number;
  match_date: string;
  our_points: number;
  their_points: number;
}

export default function TeamMatches() {
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatMatchDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    async function fetchTeamMatches() {
      try {
        const response = await fetch("/api/get-team-matches");
        if (!response.ok) {
          throw new Error("Failed to fetch team matches");
        }
        const data = await response.json();
        // Ensure points are numbers
        const matchesWithNumberPoints = data.map((match: any) => ({
          ...match,
          our_points: Number(match.our_points),
          their_points: Number(match.their_points)
        }));
        setTeamMatches(matchesWithNumberPoints);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchTeamMatches();
  }, []);

  if (loading) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
        <p className="text-muted-foreground">Loading team matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  const getScoreDisplay = (match: TeamMatch) => {
    const isWin = Number(match.our_points) > Number(match.their_points);
    
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${
          isWin ? "text-emerald-500" : "text-red-500"
        }`}>
          {match.our_points} - {match.their_points}
        </span>
        <span className="text-xs text-muted-foreground">points</span>
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
      {teamMatches.length === 0 ? (
        <p className="text-muted-foreground">No team matches found.</p>
      ) : (
        <div className="space-y-3 w-[150%]">
          {teamMatches.map((match) => {
            const isWin = Number(match.our_points) > Number(match.their_points);
            return (
              <div
                key={match.id}
                className="flex rounded-md overflow-hidden"
              >
                <div className={`w-12 flex items-center justify-center text-lg font-bold ${
                  isWin 
                    ? "bg-emerald-500 text-emerald-50" 
                    : "bg-red-500 text-red-50"
                }`}>
                  {isWin ? "W" : "L"}
                </div>
                <div className="flex-1 border border-l-0 border-input p-4 hover:bg-accent/5 transition-colors rounded-r-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">
                      vs {match.opponent_name}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {formatMatchDate(match.match_date)}
                    </span>
                  </div>
                  {getScoreDisplay(match)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
