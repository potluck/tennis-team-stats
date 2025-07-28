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
        setTeamMatches(data);
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
        <p className="text-gray-600">Loading team matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Team Matches</h2>
      {teamMatches.length === 0 ? (
        <p className="text-gray-600">No team matches found.</p>
      ) : (
        <div className="space-y-3">
          {teamMatches.map((match) => (
            <div
              key={match.id}
              className="border border-gray-200 rounded-md p-4 hover:shadow-sm transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">
                vs {match.opponent_name}
              </h3>
              <p className="text-sm text-gray-500">Match ID: {match.id}</p>
              <p className="text-sm text-gray-500">Team ID: {match.team_id}</p>
              <p className="text-sm text-gray-500">
                Date: {new Date(match.match_date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
