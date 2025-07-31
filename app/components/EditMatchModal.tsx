import { useState, useEffect } from "react";
import type { PositionResult } from "./TeamMatches";

interface Player {
  id: number;
  name: string;
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  positionResults: PositionResult[];
  onSave: (matchId: number, updatedResults: PositionResult[]) => Promise<void>;
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

export default function EditMatchModal({ isOpen, onClose, matchId, positionResults, onSave }: EditMatchModalProps) {
  const [results, setResults] = useState<PositionResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

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
    // Initialize results with all positions, using existing data where available
    const initialResults = DEFAULT_POSITIONS.map(defaultPos => {
      const existingResult = positionResults.find(
        r => r.is_singles === defaultPos.is_singles && r.pos === defaultPos.pos
      );
      return {
        is_singles: defaultPos.is_singles!,
        pos: defaultPos.pos!,
        result: existingResult?.result || "win",
        player1: existingResult?.player1 || "",
        player2: existingResult?.player2 || "",
        set1_score: existingResult?.set1_score || "",
        set2_score: existingResult?.set2_score || "",
        set3_score: existingResult?.set3_score || "",
        incomplete_reason: existingResult?.incomplete_reason || null,
      } as PositionResult;
    });
    setResults(initialResults);
  }, [positionResults]);

  if (!isOpen) return null;

  const handleScoreChange = (index: number, field: 'set1_score' | 'set2_score' | 'set3_score', value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
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
      await onSave(matchId, resultsToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save match results:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Match Scores</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Set 1</label>
                    <input
                      type="text"
                      value={result.set1_score}
                      onChange={(e) => handleScoreChange(index, 'set1_score', e.target.value)}
                      className="w-full px-3 py-1 border border-input rounded bg-background"
                      placeholder="6-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Set 2</label>
                    <input
                      type="text"
                      value={result.set2_score}
                      onChange={(e) => handleScoreChange(index, 'set2_score', e.target.value)}
                      className="w-full px-3 py-1 border border-input rounded bg-background"
                      placeholder="6-4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Set 3</label>
                    <input
                      type="text"
                      value={result.set3_score || ''}
                      onChange={(e) => handleScoreChange(index, 'set3_score', e.target.value)}
                      className="w-full px-3 py-1 border border-input rounded bg-background"
                      placeholder="10-8"
                    />
                  </div>
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
              onClick={onClose}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 