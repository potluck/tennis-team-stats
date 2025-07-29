"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  name: string;
  team_id: number;
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/get-players");
        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Players</h2>
        <p className="text-muted-foreground">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Players</h2>
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Players</h2>
      {players.length === 0 ? (
        <p className="text-muted-foreground">No players found.</p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="border border-input rounded-md p-4 hover:bg-accent/5 transition-colors"
            >
              <h3 className="text-lg font-medium">
                {player.name}
              </h3>
              <p className="text-sm text-muted-foreground">ID: {player.id}</p>
              <p className="text-sm text-muted-foreground">Team ID: {player.team_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
