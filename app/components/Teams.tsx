"use client";

import { useState, useEffect } from "react";

interface Team {
  id: number;
  name: string;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch("/api/get-teams");
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Teams</h2>
        <p className="text-muted-foreground">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Teams</h2>
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Teams</h2>
      {teams.length === 0 ? (
        <p className="text-muted-foreground">No teams found.</p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border border-input rounded-md p-4 hover:bg-accent/5 transition-colors"
            >
              <h3 className="text-lg font-medium">{team.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {team.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
