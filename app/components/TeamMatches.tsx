"use client";

import { useState, useEffect } from "react";

interface TeamMatch {
  id: number;
  opponent_name: string;
  team_id: number;
  match_date: string;
}

export default function TeamMatches() {
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamMatches() {
      try {
        const response = await fetch("/api/get-team-matches");
        if (!response.ok) {
          throw new Error("Failed to fetch team matches");
        }
        const data = await response.json();
        // Sort by date in descending order (most recent first)
        const sortedData = data.sort(
          (a: TeamMatch, b: TeamMatch) =>
            new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
        );
        setTeamMatches(sortedData);
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

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
      {teamMatches.length === 0 ? (
        <p className="text-muted-foreground">No team matches found.</p>
      ) : (
        <div className="space-y-3">
          {teamMatches.map((match) => (
            <div
              key={match.id}
              className="border border-input rounded-md p-4 hover:bg-accent/5 transition-colors"
            >
              <h3 className="text-lg font-medium">
                vs {match.opponent_name}
              </h3>
              <p className="text-sm text-muted-foreground">Match ID: {match.id}</p>
              <p className="text-sm text-muted-foreground">Team ID: {match.team_id}</p>
              <p className="text-sm text-muted-foreground">
                Date: {new Date(match.match_date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
