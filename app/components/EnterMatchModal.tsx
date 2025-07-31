"use client";

import { useState, useEffect } from "react";
import type { PositionResult } from "./TeamMatches";

interface Player {
  id: number;
  name: string;
}

interface EnterMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opponentName: string, matchDate: string, results: PositionResult[]) => Promise<void>;
}

interface ScoreInputProps {
  label: string;
  ourScore: string;
  theirScore: string;
  onOurScoreChange: (value: string) => void;
  onTheirScoreChange: (value: string) => void;
  placeholder?: string;
}

function ScoreInput({ label, ourScore, theirScore, onOurScoreChange, onTheirScoreChange, placeholder = "0" }: ScoreInputProps) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Our Score</label>
          <input
            type="text"
            value={ourScore}
            onChange={(e) => onOurScoreChange(e.target.value)}
            className="w-full px-3 py-1 border border-input rounded bg-background"
            placeholder={placeholder}
          />
        </div>
        <span className="text-muted mt-5">-</span>
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Their Score</label>
          <input
            type="text"
            value={theirScore}
            onChange={(e) => onTheirScoreChange(e.target.value)}
            className="w-full px-3 py-1 border border-input rounded bg-background"
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_POSITIONS: Partial<PositionResult>[] = [
  { is_singles: true, pos: 1 },
  { is_singles: true, pos: 2 },
  { is_singles: false, pos: 1 },
  { is_singles: false, pos: 2 },
  { is_singles: false, pos: 3 },
];

const INCOMPLETE_REASONS = [
  { value: "timeout", label: "Timeout" },
  { value: "injury", label: "Injury" },
  { value: "default", label: "Default" },
] as const;

const MATCH_RESULTS = [
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "tie", label: "Tie" },
] as const;

export default function EnterMatchModal({ isOpen, onClose, onSave }: EnterMatchModalProps) {
  const [results, setResults] = useState<PositionResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentName, setOpponentName] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const hasUnsavedChanges = (): boolean => {
    // Check if opponent name has been entered
    if (opponentName.trim()) return true;

    // Check if date has been changed from today
    const today = new Date().toISOString().split('T')[0];
    if (matchDate !== today) return true;

    // Check if any result has been modified
    return results.some(result => (
      result.player1 || 
      result.player2 || 
      result.set1_score || 
      result.set2_score || 
      result.set3_score ||
      result.incomplete_reason
    ));
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCancelConfirm(false);
    onClose();
  };

  useEffect(() => {
    // Fetch available players
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/get-players");
        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    }
    fetchPlayers();
  }, []);

  useEffect(() => {
    // Initialize results with default positions
    const initialResults = DEFAULT_POSITIONS.map(defaultPos => ({
      is_singles: defaultPos.is_singles!,
      pos: defaultPos.pos!,
      result: "win",
      player1: "",
      player2: "",
      set1_score: "",
      set2_score: "",
      set3_score: "",
      incomplete_reason: null,
    } as PositionResult));
    setResults(initialResults);
  }, []);

  if (!isOpen) return null;

  const parseScore = (score: string | null): { ourScore: string; theirScore: string } => {
    if (!score) return { ourScore: '', theirScore: '' };
    const [our, their] = score.split('-');
    return { 
      ourScore: our || '', 
      theirScore: their || '' 
    };
  };

  const formatScore = (ourScore: string, theirScore: string): string => {
    if (!ourScore && !theirScore) return '';
    return `${ourScore || ''}-${theirScore || ''}`;
  };

  const handleScoreChange = (index: number, field: 'set1_score' | 'set2_score' | 'set3_score', ourScore: string, theirScore: string) => {
    const newResults = [...results];
    newResults[index] = { 
      ...newResults[index], 
      [field]: formatScore(ourScore, theirScore)
    };
    setResults(newResults);
  };

  const handlePlayerChange = (index: number, field: 'player1' | 'player2', value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const handleResultChange = (index: number, value: PositionResult['result']) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], result: value };
    setResults(newResults);
  };

  const handleIncompleteReasonChange = (index: number, value: PositionResult['incomplete_reason']) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], incomplete_reason: value };
    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Only save positions that have at least one set score or an incomplete reason
      const resultsToSave = results.filter(
        result => result.set1_score || result.set2_score || result.set3_score || result.incomplete_reason
      );
      await onSave(opponentName, matchDate, resultsToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save match results:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {showCancelConfirm ? (
        <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
          <p className="text-muted-foreground mb-6">
            You have unsaved changes. Are you sure you want to close this window? Your changes will be lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(false)}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent/5 transition-colors"
            >
              Continue Editing
            </button>
            <button
              type="button"
              onClick={handleConfirmClose}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Discard Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-background p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Enter Match Results</h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Opponent Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Opponent Name *
                </label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  required
                  className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="Enter opponent name"
                />
              </div>

              {/* Match Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Match Date *
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

              {results.map((result, index) => (
                <div key={index} className="border border-input rounded-md p-4">
                  <div className="font-medium mb-4">
                    {result.is_singles ? 'S' : 'D'}{result.pos}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Player 1</label>
                      <select
                        value={result.player1}
                        onChange={(e) => handlePlayerChange(index, 'player1', e.target.value)}
                        className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                      >
                        <option value="">Select player</option>
                        {players.map(player => (
                          <option key={player.id} value={player.name}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!result.is_singles && (
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Player 2</label>
                        <select
                          value={result.player2 || ''}
                          onChange={(e) => handlePlayerChange(index, 'player2', e.target.value)}
                          className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                        >
                          <option value="">Select player</option>
                          {players.map(player => (
                            <option key={player.id} value={player.name}>
                              {player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-1">Result</label>
                    <select
                      value={result.result}
                      onChange={(e) => handleResultChange(index, e.target.value as PositionResult['result'])}
                      className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                    >
                      {MATCH_RESULTS.map(matchResult => (
                        <option key={matchResult.value} value={matchResult.value}>
                          {matchResult.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <ScoreInput
                      label="Set 1"
                      {...parseScore(result.set1_score)}
                      onOurScoreChange={(value) => handleScoreChange(index, 'set1_score', value, parseScore(result.set1_score).theirScore)}
                      onTheirScoreChange={(value) => handleScoreChange(index, 'set1_score', parseScore(result.set1_score).ourScore, value)}
                      placeholder="6"
                    />
                    <ScoreInput
                      label="Set 2"
                      {...parseScore(result.set2_score)}
                      onOurScoreChange={(value) => handleScoreChange(index, 'set2_score', value, parseScore(result.set2_score).theirScore)}
                      onTheirScoreChange={(value) => handleScoreChange(index, 'set2_score', parseScore(result.set2_score).ourScore, value)}
                      placeholder="6"
                    />
                    <ScoreInput
                      label="Set 3"
                      {...parseScore(result.set3_score)}
                      onOurScoreChange={(value) => handleScoreChange(index, 'set3_score', value, parseScore(result.set3_score).theirScore)}
                      onTheirScoreChange={(value) => handleScoreChange(index, 'set3_score', parseScore(result.set3_score).ourScore, value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Incomplete Reason</label>
                    <select
                      value={result.incomplete_reason || ''}
                      onChange={(e) => handleIncompleteReasonChange(index, (e.target.value || null) as PositionResult['incomplete_reason'])}
                      className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                    >
                      <option value="">None</option>
                      {INCOMPLETE_REASONS.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Match'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 