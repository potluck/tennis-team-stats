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
  onDelete?: () => void; // Optional callback for parent component to refresh data
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

export default function EditMatchModal({ isOpen, onClose, matchId, positionResults, onSave, onDelete }: EditMatchModalProps) {
  const [results, setResults] = useState<PositionResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [originalResults, setOriginalResults] = useState<PositionResult[]>([]);
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
    setOriginalResults(JSON.parse(JSON.stringify(initialResults))); // Deep copy
  }, [positionResults]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

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
      await onSave(matchId, resultsToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save match results:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/get-team-matches?id=${matchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete match');
      }

      onDelete?.(); // Call the optional callback if provided
      onClose();
    } catch (error) {
      console.error('Failed to delete match:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasUnsavedChanges = (): boolean => {
    // Compare current results with original results
    return JSON.stringify(results) !== JSON.stringify(originalResults);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      {showDeleteConfirm ? (
        <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Delete Match</h3>
          <p className="text-muted-foreground mb-6">
            Are you sure you want to delete this match? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Match'}
            </button>
          </div>
        </div>
      ) : showCancelConfirm ? (
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
            <h2 className="text-xl font-semibold">Edit Match Scores</h2>
            <button
              onClick={handleClose}
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
                      <label className="block text-sm text-muted-foreground mb-1">
                        {result.is_singles ? "" : "Player 1"}
                      </label>
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
            <div className="flex justify-between items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Delete Match
              </button>
              <div className="flex gap-3">
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
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 