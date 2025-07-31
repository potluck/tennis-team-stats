"use client";

import { useState, useEffect, useCallback } from "react";
import type { PositionResult } from "./TeamMatches";

interface Player {
  id: number;
  name: string;
}

interface BaseMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: (results: PositionResult[], opponentName?: string, matchDate?: string) => Promise<void>;
  initialResults?: PositionResult[];
  showDeleteButton?: boolean;
  onDelete?: () => Promise<void>;
  showOpponentAndDate?: boolean;
  initialOpponentName?: string;
  initialMatchDate?: string;
}

interface ScoreInputProps {
  label: string;
  ourScore: number | "";
  theirScore: number | "";
  onOurScoreChange: (value: number | "") => void;
  onTheirScoreChange: (value: number | "") => void;
  isThirdSet?: boolean;
  incompleteReason: string | null;
  isValid: boolean;
}

function ScoreInput({
  label,
  ourScore,
  theirScore,
  onOurScoreChange,
  onTheirScoreChange,
  isThirdSet = false,
  incompleteReason,
  isValid,
}: ScoreInputProps) {
  // Helper function to get score options based on whether match is incomplete
  const getScoreOptions = (partnerScore: number | ""): number[] => {
    // If incomplete reason is selected, allow any score from 0-7 (or 0-1 for third set)
    if (incompleteReason) {
      return isThirdSet ? [0, 1] : [0, 1, 2, 3, 4, 5, 6, 7];
    }

    // Otherwise, use normal tennis scoring rules
    if (isThirdSet) {
      return getValidScoresForThirdSet(partnerScore);
    } else {
      return getValidScoresForRegularSet(partnerScore);
    }
  };

  const getValidScoresForRegularSet = (partnerScore: number | ""): number[] => {
    if (partnerScore === "") return [0, 1, 2, 3, 4, 5, 6, 7];

    const validCombinations = [
      [6, 0],
      [6, 1],
      [6, 2],
      [6, 3],
      [6, 4],
      [0, 6],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
      [7, 5],
      [5, 7],
      [7, 6],
      [6, 7],
    ];

    return validCombinations
      .filter(([, b]) => b === partnerScore)
      .map(([a]) => a);
  };

  const getValidScoresForThirdSet = (partnerScore: number | ""): number[] => {
    if (partnerScore === "") return [0, 1];
    if (partnerScore === 0) return [1];
    if (partnerScore === 1) return [0, 1];
    return [];
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <select
          value={ourScore}
          onChange={(e) =>
            onOurScoreChange(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">Us</option>
          {getScoreOptions(theirScore).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        <span className="text-muted">-</span>
        <select
          value={theirScore}
          onChange={(e) =>
            onTheirScoreChange(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">Them</option>
          {getScoreOptions(ourScore).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>
      {ourScore !== "" &&
        theirScore !== "" &&
        !incompleteReason &&
        !isValid && (
          <p className="text-destructive text-sm mt-1">
            Invalid score combination
          </p>
        )}
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

const getPositionName = (isSingles: boolean, pos: number): string => {
  if (isSingles) {
    return `Singles ${pos}`;
  }
  return `Doubles ${pos}`;
};

// Enhanced PositionResult interface for internal state
interface EnhancedPositionResult
  extends Omit<PositionResult, "set1_score" | "set2_score" | "set3_score"> {
  set1OurScore: number | "";
  set1TheirScore: number | "";
  set2OurScore: number | "";
  set2TheirScore: number | "";
  set3OurScore: number | "";
  set3TheirScore: number | "";
  manualResult: string;
}

export default function BaseMatchModal({
  isOpen,
  onClose,
  title,
  onSave,
  showDeleteButton = false,
  onDelete,
  showOpponentAndDate = false,
  initialOpponentName,
  initialMatchDate
}: BaseMatchModalProps) {
  const [results, setResults] = useState<EnhancedPositionResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentName, setOpponentName] = useState(initialOpponentName || "");
  const [matchDate, setMatchDate] = useState(initialMatchDate || new Date().toISOString().split("T")[0]);

  // Score validation functions
  const isValidRegularSetScore = (
    ourScore: number | "",
    theirScore: number | ""
  ): boolean => {
    if (ourScore === "" || theirScore === "") return true;

    const validCombinations = [
      [6, 0],
      [6, 1],
      [6, 2],
      [6, 3],
      [6, 4],
      [0, 6],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
      [7, 5],
      [5, 7],
      [7, 6],
      [6, 7],
    ];

    return validCombinations.some(
      ([a, b]) => a === ourScore && b === theirScore
    );
  };

  const isValidThirdSetScore = (
    ourScore: number | "",
    theirScore: number | ""
  ): boolean => {
    if (ourScore === "" || theirScore === "") return true;
    return (
      (ourScore === 1 && theirScore === 0) ||
      (ourScore === 0 && theirScore === 1) ||
      (ourScore === 1 && theirScore === 1)
    );
  };

  // Function to determine set winner: 0 = no winner, 1 = we won, 2 = they won, 3 = tie
  const getSetWinner = useCallback(
    (ourScore: number | "", theirScore: number | ""): number => {
      if (ourScore === "" || theirScore === "") return 0;

      // Check third set scores first (super tiebreak)
      if (ourScore === 1 && theirScore === 0) return 1;
      if (ourScore === 0 && theirScore === 1) return 2;
      if (ourScore === 1 && theirScore === 1) return 3;

      // Check all combinations where we win (regular sets)
      const weWinCombinations = [
        [6, 0],
        [6, 1],
        [6, 2],
        [6, 3],
        [6, 4],
        [7, 5],
        [7, 6],
      ];

      if (
        weWinCombinations.some(([a, b]) => a === ourScore && b === theirScore)
      ) {
        return 1;
      }

      // Check all combinations where they win (regular sets)
      const theyWinCombinations = [
        [0, 6],
        [1, 6],
        [2, 6],
        [3, 6],
        [4, 6],
        [5, 7],
        [6, 7],
      ];

      if (
        theyWinCombinations.some(([a, b]) => a === ourScore && b === theirScore)
      ) {
        return 2;
      }

      return 0;
    },
    []
  );

  // Check if third set should be hidden (same team won first two sets)
  const shouldHideThirdSet = useCallback(
    (result: EnhancedPositionResult): boolean => {
      const set1Winner = getSetWinner(
        result.set1OurScore,
        result.set1TheirScore
      );
      const set2Winner = getSetWinner(
        result.set2OurScore,
        result.set2TheirScore
      );

      return set1Winner !== 0 && set2Winner !== 0 && set1Winner === set2Winner;
    },
    [getSetWinner]
  );

  // Determine overall match result based on sets won
  const getMatchResult = (
    result: EnhancedPositionResult
  ): "win" | "loss" | "tie" => {
    // If incomplete reason is selected, use manual result
    if (result.incomplete_reason && result.manualResult) {
      return result.manualResult as "win" | "loss" | "tie";
    }

    const set1Winner = getSetWinner(result.set1OurScore, result.set1TheirScore);
    const set2Winner = getSetWinner(result.set2OurScore, result.set2TheirScore);
    const set3Winner = getSetWinner(result.set3OurScore, result.set3TheirScore);

    // Count sets won by each team
    let ourSetsWon = 0;
    let theirSetsWon = 0;

    if (set1Winner === 1) ourSetsWon++;
    else if (set1Winner === 2) theirSetsWon++;

    if (set2Winner === 1) ourSetsWon++;
    else if (set2Winner === 2) theirSetsWon++;

    if (set3Winner === 1) ourSetsWon++;
    else if (set3Winner === 2) theirSetsWon++;

    // Special case: If third set is a tie (1-1)
    if (set3Winner === 3) {
      // If sets are split 1-1 after first two, and third set is 1-1, it's a match tie
      if (set1Winner !== 0 && set2Winner !== 0 && set1Winner !== set2Winner) {
        return "tie";
      }
    }

    // Determine result based on sets won
    if (ourSetsWon > theirSetsWon) return "win";
    if (theirSetsWon > ourSetsWon) return "loss";

    return "win"; // Default fallback
  };

  // Check if result should be automatically determined
  const isResultAutoDetermined = (result: EnhancedPositionResult): boolean => {
    // If incomplete reason is selected, result is manually determined
    if (result.incomplete_reason) {
      return result.manualResult !== "";
    }

    const set1Winner = getSetWinner(result.set1OurScore, result.set1TheirScore);
    const set2Winner = getSetWinner(result.set2OurScore, result.set2TheirScore);

    // Auto-determined if same team won first 2 sets
    if (set1Winner !== 0 && set2Winner !== 0 && set1Winner === set2Winner) {
      return true;
    }

    // Auto-determined if all 3 sets are complete (including ties)
    if (set1Winner !== 0 && set2Winner !== 0) {
      const set3Winner = getSetWinner(
        result.set3OurScore,
        result.set3TheirScore
      );
      if (set3Winner !== 0) {
        return true;
      }
    }

    return false;
  };

  const resetForm = () => {
    setOpponentName("");
    setMatchDate(new Date().toISOString().split("T")[0]);
    const initialResults = DEFAULT_POSITIONS.map(
      (defaultPos) =>
        ({
          is_singles: defaultPos.is_singles!,
          pos: defaultPos.pos!,
          result: "win",
          player1: "",
          player2: "",
          set1OurScore: "" as number | "",
          set1TheirScore: "" as number | "",
          set2OurScore: "" as number | "",
          set2TheirScore: "" as number | "",
          set3OurScore: "" as number | "",
          set3TheirScore: "" as number | "",
          incomplete_reason: null,
          manualResult: "",
        } as EnhancedPositionResult)
    );
    setResults(initialResults);
    setShowCancelConfirm(false);
  };

  const hasUnsavedChanges = useCallback((): boolean => {
    if (showOpponentAndDate) {
      if (opponentName.trim()) return true;
      const today = new Date().toISOString().split("T")[0];
      if (matchDate !== today) return true;
    }

    return results.some(
      (result) =>
        result.player1 ||
        result.player2 ||
        result.set1OurScore !== "" ||
        result.set1TheirScore !== "" ||
        result.set2OurScore !== "" ||
        result.set2TheirScore !== "" ||
        result.set3OurScore !== "" ||
        result.set3TheirScore !== "" ||
        result.incomplete_reason ||
        result.manualResult
    );
  }, [showOpponentAndDate, opponentName, matchDate, results]);

  // Score change handlers with validation and auto-completion
  const handleScoreChange = (
    index: number,
    field: keyof Pick<
      EnhancedPositionResult,
      | "set1OurScore"
      | "set1TheirScore"
      | "set2OurScore"
      | "set2TheirScore"
      | "set3OurScore"
      | "set3TheirScore"
    >,
    newScore: number | ""
  ) => {
    const newResults = [...results];
    const result = { ...newResults[index] };
    result[field] = newScore;

    // Auto-complete logic for regular sets
    if (!result.incomplete_reason) {
      const isThirdSet = field.includes("set3");
      const isOurScore = field.includes("Our");

      if (newScore !== "") {
        const partnerField = isOurScore
          ? (field.replace("Our", "Their") as keyof EnhancedPositionResult)
          : (field.replace("Their", "Our") as keyof EnhancedPositionResult);

        const partnerScore = result[partnerField] as number | "";

        if (partnerScore !== "") {
          // Validate combination
          const validFunction = isThirdSet
            ? isValidThirdSetScore
            : isValidRegularSetScore;
          const ourScore = isOurScore ? newScore : partnerScore;
          const theirScore = isOurScore ? partnerScore : newScore;

          if (!validFunction(ourScore, theirScore)) {
            (result as unknown as Record<string, number | "">)[partnerField] = "";
          }
        } else {
          // Auto-complete if there's only one valid option
          const getValidScores = isThirdSet
            ? (score: number | "") =>
                score === ""
                  ? [0, 1]
                  : score === 0
                  ? [1]
                  : score === 1
                  ? [0, 1]
                  : []
            : (score: number | "") => {
                if (score === "") return [0, 1, 2, 3, 4, 5, 6, 7];
                const validCombinations = [
                  [6, 0],
                  [6, 1],
                  [6, 2],
                  [6, 3],
                  [6, 4],
                  [0, 6],
                  [1, 6],
                  [2, 6],
                  [3, 6],
                  [4, 6],
                  [7, 5],
                  [5, 7],
                  [7, 6],
                  [6, 7],
                ];
                return validCombinations
                  .filter(([, b]) => b === score)
                  .map(([a]) => a);
              };

          const validOptions = getValidScores(newScore);
          if (validOptions.length === 1) {
            (result as unknown as Record<string, number | "">)[partnerField] = validOptions[0];
          }
        }
      }
    }

    // Clear third set when it should be hidden
    if (shouldHideThirdSet(result)) {
      result.set3OurScore = "";
      result.set3TheirScore = "";
    }

    // Auto-determine result if possible
    result.result = getMatchResult(result);

    newResults[index] = result;
    setResults(newResults);
  };

  const handlePlayerChange = (
    index: number,
    field: "player1" | "player2",
    value: string
  ) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const handleIncompleteReasonChange = (
    index: number,
    value: "timeout" | "injury" | "default" | null
  ) => {
    const newResults = [...results];
    const result = { ...newResults[index] };
    result.incomplete_reason = value;
    result.manualResult = ""; // Reset manual result when changing incomplete reason

    // Auto-determine result if no incomplete reason
    if (!value) {
      result.result = getMatchResult(result);
    }

    newResults[index] = result;
    setResults(newResults);
  };

  const handleManualResultChange = (
    index: number,
    value: "win" | "loss" | "tie"
  ) => {
    const newResults = [...results];
    const result = { ...newResults[index] };
    result.manualResult = value;
    result.result = value;
    newResults[index] = result;
    setResults(newResults);
  };

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowCancelConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

  useEffect(() => {
    // Fetch available players
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/get-players");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching players:", error);
        // Don't throw the error, just log it and continue with empty players array
      }
    }
    fetchPlayers();
  }, []);

  useEffect(() => {
    const initialResults = DEFAULT_POSITIONS.map(
      (defaultPos) =>
        ({
          is_singles: defaultPos.is_singles!,
          pos: defaultPos.pos!,
          result: "win",
          player1: "",
          player2: "",
          set1OurScore: "" as number | "",
          set1TheirScore: "" as number | "",
          set2OurScore: "" as number | "",
          set2TheirScore: "" as number | "",
          set3OurScore: "" as number | "",
          set3TheirScore: "" as number | "",
          incomplete_reason: null,
          manualResult: "",
        } as EnhancedPositionResult)
    );
    setResults(initialResults);
  }, []);

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
  }, [isOpen, handleClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Convert internal format back to PositionResult format
      const resultsToSave: PositionResult[] = results
        .filter(
          (result) =>
            result.set1OurScore !== "" ||
            result.set1TheirScore !== "" ||
            result.set2OurScore !== "" ||
            result.set2TheirScore !== "" ||
            result.set3OurScore !== "" ||
            result.set3TheirScore !== "" ||
            result.incomplete_reason
        )
        .map((result) => ({
          is_singles: result.is_singles,
          pos: result.pos,
          result: result.result,
          player1: result.player1,
          player2: result.is_singles ? null : result.player2 || null,
          set1_score:
            result.set1OurScore !== "" && result.set1TheirScore !== ""
              ? `${result.set1OurScore}-${result.set1TheirScore}`
              : "",
          set2_score:
            result.set2OurScore !== "" && result.set2TheirScore !== ""
              ? `${result.set2OurScore}-${result.set2TheirScore}`
              : "",
          set3_score:
            result.set3OurScore !== "" && result.set3TheirScore !== ""
              ? `${result.set3OurScore}-${result.set3TheirScore}`
              : null,
          incomplete_reason: result.incomplete_reason,
        }));

      await onSave(resultsToSave, opponentName, matchDate);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save match results:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete match:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {showOpponentAndDate && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Opponent Name</label>
                    <input
                      type="text"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                      placeholder="Enter opponent name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Match Date</label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                    />
                  </div>
                </div>
              )}
              {results.map((result, index) => (
                <div key={index} className="border border-input rounded-md p-4">
                  <div className="font-bold mb-4">
                    {getPositionName(result.is_singles, result.pos)}
                  </div>

                  {/* Player Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        {result.is_singles ? "" : "Player 1"}
                      </label>
                      <select
                        value={result.player1}
                        onChange={(e) =>
                          handlePlayerChange(index, "player1", e.target.value)
                        }
                        className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                      >
                        <option value="">Select player</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.name}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!result.is_singles && (
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Player 2
                        </label>
                        <select
                          value={result.player2 || ""}
                          onChange={(e) =>
                            handlePlayerChange(index, "player2", e.target.value)
                          }
                          className="w-full px-3 py-1 border border-input rounded bg-background text-sm"
                        >
                          <option value="">Select player</option>
                          {players.map((player) => (
                            <option key={player.id} value={player.name}>
                              {player.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Set Scores */}
                  <div className="space-y-4 mb-4">
                    <ScoreInput
                      label="Set 1 Score *"
                      ourScore={result.set1OurScore}
                      theirScore={result.set1TheirScore}
                      onOurScoreChange={(value) =>
                        handleScoreChange(index, "set1OurScore", value)
                      }
                      onTheirScoreChange={(value) =>
                        handleScoreChange(index, "set1TheirScore", value)
                      }
                      incompleteReason={result.incomplete_reason}
                      isValid={
                        result.incomplete_reason
                          ? true
                          : isValidRegularSetScore(
                              result.set1OurScore,
                              result.set1TheirScore
                            )
                      }
                    />
                    <ScoreInput
                      label="Set 2 Score *"
                      ourScore={result.set2OurScore}
                      theirScore={result.set2TheirScore}
                      onOurScoreChange={(value) =>
                        handleScoreChange(index, "set2OurScore", value)
                      }
                      onTheirScoreChange={(value) =>
                        handleScoreChange(index, "set2TheirScore", value)
                      }
                      incompleteReason={result.incomplete_reason}
                      isValid={
                        result.incomplete_reason
                          ? true
                          : isValidRegularSetScore(
                              result.set2OurScore,
                              result.set2TheirScore
                            )
                      }
                    />
                    {!shouldHideThirdSet(result) && (
                      <ScoreInput
                        label="Set 3 Score"
                        ourScore={result.set3OurScore}
                        theirScore={result.set3TheirScore}
                        onOurScoreChange={(value) =>
                          handleScoreChange(index, "set3OurScore", value)
                        }
                        onTheirScoreChange={(value) =>
                          handleScoreChange(index, "set3TheirScore", value)
                        }
                        isThirdSet={true}
                        incompleteReason={result.incomplete_reason}
                        isValid={
                          result.incomplete_reason
                            ? true
                            : isValidThirdSetScore(
                                result.set3OurScore,
                                result.set3TheirScore
                              )
                        }
                      />
                    )}
                  </div>

                  {/* Incomplete Reason */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Incomplete Reason (Optional)
                    </label>
                    <select
                      value={result.incomplete_reason || ""}
                      onChange={(e) =>
                        handleIncompleteReasonChange(
                          index,
                          (e.target.value || null) as
                            | "timeout"
                            | "injury"
                            | "default"
                            | null
                        )
                      }
                      className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">None - Complete Match</option>
                      {INCOMPLETE_REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Result Selection (only if incomplete) */}
                  {result.incomplete_reason && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Match Result *
                      </label>
                      <select
                        value={result.manualResult}
                        onChange={(e) =>
                          handleManualResultChange(
                            index,
                            e.target.value as "win" | "loss" | "tie"
                          )
                        }
                        required
                        className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      >
                        <option value="">Select result</option>
                        {MATCH_RESULTS.map((matchResult) => (
                          <option
                            key={matchResult.value}
                            value={matchResult.value}
                          >
                            {matchResult.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Result Display */}
                  {isResultAutoDetermined(result) && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Match Result
                      </label>
                      <div
                        className={`w-full p-3 border rounded-md ${
                          getMatchResult(result) === "win"
                            ? "bg-primary/10 border-primary text-primary"
                            : getMatchResult(result) === "loss"
                            ? "bg-destructive/10 border-destructive text-destructive"
                            : "bg-accent/10 border-accent text-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="font-medium capitalize">
                            {getMatchResult(result)}
                          </span>
                          <span className="text-sm ml-2 opacity-80">
                            {result.incomplete_reason
                              ? `(Manual - ${result.incomplete_reason})`
                              : "(Auto-determined from set scores)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center gap-3 mt-6">
              {showDeleteButton && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                >
                  Delete Match
                </button>
              )}
              <div className="flex gap-3 ml-auto">
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