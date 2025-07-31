"use client";

import { useState, useEffect } from "react";
import EditMatchModal from "./EditMatchModal";

export interface PositionResult {
  is_singles: boolean;
  pos: number;
  result: "win" | "loss" | "tie";
  player1: string;
  player2: string | null;
  set1_score: string;
  set2_score: string;
  set3_score: string | null;
  incomplete_reason: "timeout" | "injury" | "default" | null;
}

interface TeamMatch {
  id: number;
  opponent_name: string;
  team_id: number;
  match_date: string;
  our_points: number;
  their_points: number;
  position_results: PositionResult[];
}

interface TeamMatchesProps {
  onAddMatch: () => void;
}

export default function TeamMatches({ onAddMatch }: TeamMatchesProps) {
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/get-team-matches");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeamMatches(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching team matches:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch team matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSaveScores = async (matchId: number, results: PositionResult[]) => {
    try {
      const response = await fetch("/api/update-match-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId, results }),
      });

      if (!response.ok) {
        throw new Error("Failed to update match scores");
      }

      // Refresh the matches data
      await fetchMatches();
    } catch (error) {
      console.error("Error saving match scores:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getScoreDisplay = (match: TeamMatch) => {
    const isWin = Number(match.our_points) > Number(match.their_points);
    return (
      <span className={`text-lg font-bold ml-2 ${
        isWin ? "text-emerald-500" : "text-red-500"
      }`}>
        ({match.our_points} - {match.their_points})
      </span>
    );
  };

  const getSetScores = (pos: PositionResult) => {
    // If there's an explicit default reason or no scores, show DEFAULT
    if (pos.incomplete_reason === "default" || (!pos.set1_score && !pos.set2_score && !pos.set3_score)) {
      return "DEFAULT";
    }
    
    const scores = [pos.set1_score, pos.set2_score, pos.set3_score]
      .filter(score => score && score.trim() !== "")
      .join(", ");
      
    return scores;
  };

  const getPositionResults = (match: TeamMatch) => {
    if (!match.position_results) return null;

    const singlesResults = match.position_results.filter(pos => pos.is_singles);
    const doublesResults = match.position_results.filter(pos => !pos.is_singles);

    const renderResult = (pos: PositionResult) => (
      <div 
        key={`${pos.is_singles}-${pos.pos}`} 
        className="flex items-center gap-4 p-3 border border-input rounded-md bg-background/50"
      >
        <div className="flex-1">
          <span className="text-sm text-muted-foreground">
            {pos.is_singles ? "S" : "D"}{pos.pos}:
          </span>
          <span className={`text-sm font-medium ml-2 ${
            pos.result === "win" ? "text-emerald-500" : 
            pos.result === "loss" ? "text-red-500" : 
            "text-foreground"
          }`}>
            {pos.result === "win" ? "W" : pos.result === "loss" ? "L" : "T"}
          </span>
          <span className="text-sm ml-2 text-muted-foreground">
            ({getSetScores(pos)})
          </span>
        </div>
        <span className="text-sm font-medium">
          {pos.is_singles ? pos.player1 : `${pos.player1} / ${pos.player2}`}
        </span>
      </div>
    );

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-3">
          {singlesResults.map(renderResult)}
        </div>
        <div className="space-y-3">
          {doublesResults.map(renderResult)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Team Matches</h2>
        <button
          onClick={onAddMatch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Add New
        </button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading team matches...</p>
      ) : error ? (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
      ) : teamMatches.length === 0 ? (
        <p className="text-muted-foreground">No team matches found.</p>
      ) : (
        <div className="space-y-3">
          {teamMatches.map((match) => {
            const isWin = Number(match.our_points) > Number(match.their_points);
            return (
              <div
                key={match.id}
                className="flex rounded-md overflow-hidden w-full"
              >
                <div className={`w-16 flex items-center justify-center text-lg font-bold ${
                  isWin 
                    ? "bg-emerald-500 text-emerald-50" 
                    : "bg-red-500 text-red-50"
                }`}>
                  {isWin ? "W" : "L"}
                </div>
                <div className="flex-1 border border-l-0 border-input p-4 hover:bg-accent/5 transition-colors rounded-r-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">
                        vs {match.opponent_name}
                      </h3>
                      {getScoreDisplay(match)}
                      <button
                        onClick={() => setEditingMatch(match.id)}
                        className="ml-3 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit match scores"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatMatchDate(match.match_date)}
                    </span>
                  </div>
                  {getPositionResults(match)}
                </div>
              </div>
            );
          })}
          {editingMatch !== null && (
            <EditMatchModal
              isOpen={true}
              onClose={() => setEditingMatch(null)}
              matchId={editingMatch}
              positionResults={teamMatches.find(m => m.id === editingMatch)?.position_results || []}
              onSave={handleSaveScores}
              onDelete={fetchMatches}
            />
          )}
        </div>
      )}
    </div>
  );
}
