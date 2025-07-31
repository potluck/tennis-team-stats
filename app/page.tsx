"use client";

import PlayerStatistics from "./components/PlayerStatistics";
import TeamMatches from "./components/TeamMatches";
import EnterMatchModal from "./components/EnterMatchModal";
import { useState } from "react";
import type { PositionResult } from "./components/TeamMatches";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

      // Trigger refresh of both components
      setRefreshTrigger(prev => prev + 1);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save match:", error);
      throw error;
    }
  };

  const handleMatchUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <img 
              src="/USTA_logo.svg" 
              alt="USTA Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">USTA Team Stats</h1>
          </div>
        </div>

        <PlayerStatistics key={`stats-${refreshTrigger}`} />
        <div className="my-6 sm:my-8" />

        <TeamMatches 
          onAddMatch={() => setIsModalOpen(true)} 
          onMatchUpdate={handleMatchUpdate}
          key={`matches-${refreshTrigger}`}
        />

        <EnterMatchModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMatch}
        />
      </main>
    </div>
  );
}