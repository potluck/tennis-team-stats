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
  onMatchUpdate: () => void;
}

export default function TeamMatches({ onAddMatch, onMatchUpdate }: TeamMatchesProps) {
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

  const handleSaveScores = async (matchId: number, updatedResults: PositionResult[]) => {
    try {
      const response = await fetch("/api/update-match-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          results: updatedResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update match scores");
      }

      // Refresh the matches list and trigger parent update
      await fetchMatches();
      onMatchUpdate();
    } catch (error) {
      console.error("Failed to save match scores:", error);
      throw error;
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getScoreDisplay = (match: TeamMatch) => {
    const ourPoints = Number(match.our_points);
    const theirPoints = Number(match.their_points);
    
    let textColorClass;
    if (ourPoints > theirPoints) {
      textColorClass = "text-emerald-500";
    } else if (ourPoints < theirPoints) {
      textColorClass = "text-red-500";
    } else {
      textColorClass = "text-gray-500";
    }

    // Format scores to remove trailing zeros
    const formatScore = (score: number) => {
      return score % 1 === 0 ? score.toString() : score.toFixed(1).replace(/\.0$/, '');
    };

    return (
      <span className={`text-sm sm:text-lg font-bold ml-0 ${textColorClass}`}>
        ({formatScore(ourPoints)} - {formatScore(theirPoints)})
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
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border border-input rounded-md bg-background/50"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {pos.is_singles ? "S" : "D"}{pos.pos}:
          </span>
          <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded ${
            pos.result === "win" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
            pos.result === "loss" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : 
            "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
          }`}>
            {pos.result === "win" ? "W" : pos.result === "loss" ? "L" : "T"}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            ({getSetScores(pos)})
          </span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-right sm:text-left">
          {pos.is_singles ? pos.player1 : (
            <div className="flex flex-col">
              <span>{pos.player1}</span>
              <span className="text-muted-foreground">/ {pos.player2}</span>
            </div>
          )}
        </span>
      </div>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {singlesResults.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Singles</h4>
            {singlesResults.map(renderResult)}
          </div>
        )}
        {doublesResults.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Doubles</h4>
            {doublesResults.map(renderResult)}
          </div>
        )}
      </div>
    );
  };

  const getMatchResult = (match: TeamMatch) => {
    const ourPoints = Number(match.our_points);
    const theirPoints = Number(match.their_points);
    if (ourPoints > theirPoints) {
      return { letter: "W", bgClass: "bg-emerald-500 text-emerald-50" };
    } else if (ourPoints < theirPoints) {
      return { letter: "L", bgClass: "bg-red-500 text-red-50" };
    } else {
      return { letter: "T", bgClass: "bg-gray-500 text-gray-50" };
    }
  };

  return (
    <div className="bg-background text-foreground rounded-lg border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Team Matches</h2>
        <button
          onClick={onAddMatch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm sm:text-base w-full sm:w-auto font-bold"
        >
          Add New
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading team matches...</p>
        </div>
      ) : error ? (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
      ) : teamMatches.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No team matches found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teamMatches.map((match) => {
            const result = getMatchResult(match);
            return (
              <div
                key={match.id}
                className="flex flex-col sm:flex-row rounded-lg overflow-hidden w-full border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md"
              >
                <div className={`w-full sm:w-16 h-12 sm:h-auto flex items-center justify-center text-lg sm:text-xl font-bold ${result.bgClass}`}>
                  {result.letter}
                </div>
                <div className="flex-1 p-4 sm:p-6 hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold">
                          vs {match.opponent_name}
                        </h3>
                        {getScoreDisplay(match)}
                        <button
                          onClick={() => setEditingMatch(match.id)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
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
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatMatchDate(match.match_date)}
                      </span>
                    </div>
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
              onDelete={() => {
                fetchMatches();
                onMatchUpdate();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
