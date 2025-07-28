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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Players</h2>
        <p className="text-gray-600">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Players</h2>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Players</h2>
      {players.length === 0 ? (
        <p className="text-gray-600">No players found.</p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="border border-gray-200 rounded-md p-4 hover:shadow-sm transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">
                {player.name}
              </h3>
              <p className="text-sm text-gray-500">ID: {player.id}</p>
              <p className="text-sm text-gray-500">Team ID: {player.team_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
