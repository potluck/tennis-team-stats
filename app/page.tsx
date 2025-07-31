"use client";

import PlayerStatistics from "./components/PlayerStatistics";
import TeamMatches from "./components/TeamMatches";
import EnterMatchModal from "./components/EnterMatchModal";
import { useState } from "react";
import type { PositionResult } from "./components/TeamMatches";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveMatch = async (opponentName: string, matchDate: string, results: PositionResult[]) => {
    try {
      // First create the team match
      const matchResponse = await fetch("/api/get-team-matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opponent_name: opponentName,
          match_date: matchDate,
        }),
      });

      if (!matchResponse.ok) {
        throw new Error("Failed to create team match");
      }

      const { id: matchId } = await matchResponse.json();

      // Then insert all the match results
      await Promise.all(results.map(async (result) => {
        await fetch("/api/insert-match-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team_match_id: matchId,
            ...result,
          }),
        });
      }));

      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      console.error("Failed to save match:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold">Tennis Team Stats</h1>
        </div>

        <PlayerStatistics />
        <br />
        <br />

        <TeamMatches onAddMatch={() => setIsModalOpen(true)} />

        <EnterMatchModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMatch}
        />
      </main>
    </div>
  );
}
