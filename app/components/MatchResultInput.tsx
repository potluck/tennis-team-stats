"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Player {
  id: number;
  name: string;
  team_id: number;
}

interface TeamMatch {
  id: number;
  match_date: string;
  opponent_name: string;
}

export default function MatchResultInput() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [teamMatchId, setTeamMatchId] = useState<number | "">("");
  const [isSingles, setIsSingles] = useState(true);
  const [pos, setPos] = useState<number | "">(1);
  const [player1, setPlayer1] = useState<number | "">("");
  const [player2, setPlayer2] = useState<number | "">("");
  const [set1OurScore, setSet1OurScore] = useState<number | "">("");
  const [set1TheirScore, setSet1TheirScore] = useState<number | "">("");
  const [set2OurScore, setSet2OurScore] = useState<number | "">("");
  const [set2TheirScore, setSet2TheirScore] = useState<number | "">("");
  const [set3OurScore, setSet3OurScore] = useState<number | "">("");
  const [set3TheirScore, setSet3TheirScore] = useState<number | "">("");
  const [incompleteReason, setIncompleteReason] = useState<string>("");
  const [manualResult, setManualResult] = useState<string>("");

  // Helper function to safely format dates
  const formatMatchDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      console.log(date);
      if (isNaN(date.getTime())) {
        // If date is invalid, return the original string
        return dateString;
      }
      return new Date(date.getTime() + 12 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
        }
      );
    } catch {
      // If any error occurs, return the original string
      return dateString;
    }
  };

  // Helper functions for score validation
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

  // Helper function to get score options based on whether match is incomplete
  const getScoreOptions = (
    partnerScore: number | "",
    isThirdSet: boolean = false
  ): number[] => {
    // If incomplete reason is selected, allow any score from 0-7 (or 0-1 for third set)
    if (incompleteReason) {
      return isThirdSet ? [0, 1] : [0, 1, 2, 3, 4, 5, 6, 7];
    }

    // Otherwise, use normal tennis scoring rules
    return isThirdSet
      ? getValidScoresForThirdSet(partnerScore)
      : getValidScoresForRegularSet(partnerScore);
  };

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

  // Function to determine set winner: 0 = no winner (incomplete), 1 = we won, 2 = they won, 3 = tie
  const getSetWinner = useCallback(
    (ourScore: number | "", theirScore: number | ""): number => {
      if (ourScore === "" || theirScore === "") return 0;

      // Check third set scores first (super tiebreak)
      if (ourScore === 1 && theirScore === 0) return 1; // We win third set
      if (ourScore === 0 && theirScore === 1) return 2; // They win third set
      if (ourScore === 1 && theirScore === 1) return 3; // Tie in third set

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

      return 0; // No winner or invalid combination
    },
    []
  );

  // Check if third set should be hidden (same team won first two sets)
  const shouldHideThirdSet = useCallback((): boolean => {
    const set1Winner = getSetWinner(set1OurScore, set1TheirScore);
    const set2Winner = getSetWinner(set2OurScore, set2TheirScore);

    // Hide if both sets are complete and same team won both
    return set1Winner !== 0 && set2Winner !== 0 && set1Winner === set2Winner;
  }, [
    set1OurScore,
    set1TheirScore,
    set2OurScore,
    set2TheirScore,
    getSetWinner,
  ]);

  // Determine overall match result based on sets won
  const getMatchResult = (): string => {
    // If incomplete reason is selected, use manual result
    if (incompleteReason && manualResult) {
      return manualResult;
    }

    const set1Winner = getSetWinner(set1OurScore, set1TheirScore);
    const set2Winner = getSetWinner(set2OurScore, set2TheirScore);
    const set3Winner = getSetWinner(set3OurScore, set3TheirScore);

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

    // If we have set scores but no clear winner yet, return current manual result
    return "win"; // Default to win if no clear winner
  };

  // Check if result should be automatically determined
  const isResultAutoDetermined = (): boolean => {
    // If incomplete reason is selected, result is manually determined
    if (incompleteReason) {
      return manualResult !== "";
    }

    const set1Winner = getSetWinner(set1OurScore, set1TheirScore);
    const set2Winner = getSetWinner(set2OurScore, set2TheirScore);

    // Auto-determined if same team won first 2 sets
    if (set1Winner !== 0 && set2Winner !== 0 && set1Winner === set2Winner) {
      return true;
    }

    // Auto-determined if all 3 sets are complete (including ties)
    if (set1Winner !== 0 && set2Winner !== 0) {
      const set3Winner = getSetWinner(set3OurScore, set3TheirScore);
      if (set3Winner !== 0) {
        // 1, 2, or 3 (win, loss, or tie)
        return true;
      }
    }

    return false;
  };

  // Check if all required fields are filled
  const areRequiredFieldsFilled = (): boolean => {
    // Team match must be selected
    if (!teamMatchId) return false;

    // Player 1 must be selected
    if (!player1) return false;

    // For doubles, player 2 must be selected
    if (!isSingles && !player2) return false;

    return true;
  };

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return areRequiredFieldsFilled() && isResultAutoDetermined();
  };

  // Get the reason why submission is blocked
  const getSubmissionBlockReason = (): string => {
    if (!areRequiredFieldsFilled()) {
      if (!teamMatchId) return "Select a team match";
      if (!player1) return "Select Player 1";
      if (!isSingles && !player2) return "Select Player 2";
    }
    if (!isResultAutoDetermined()) {
      if (incompleteReason) {
        return "Select match result";
      }
      return "Complete set scores";
    }
    return "";
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [playersResponse, matchesResponse] = await Promise.all([
          fetch("/api/get-players"),
          fetch("/api/get-team-matches"),
        ]);

        if (!playersResponse.ok || !matchesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const playersData = await playersResponse.json();
        const matchesData = await matchesResponse.json();

        // Filter players for team ID 1
        const team1Players = playersData.filter(
          (player: Player) => player.team_id === 1
        );

        setPlayers(team1Players);
        setTeamMatches(matchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Clear third set when it should be hidden
  useEffect(() => {
    if (shouldHideThirdSet()) {
      setSet3OurScore("");
      setSet3TheirScore("");
    }
  }, [
    set1OurScore,
    set1TheirScore,
    set2OurScore,
    set2TheirScore,
    shouldHideThirdSet,
  ]);

  // Score change handlers with validation and auto-completion
  const handleSet1OurScoreChange = (newScore: number | "") => {
    setSet1OurScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set1TheirScore !== "") {
      if (!isValidRegularSetScore(newScore, set1TheirScore)) {
        setSet1TheirScore("");
      }
    } else if (newScore !== "" && set1TheirScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForRegularSet(newScore);
      if (validOptions.length === 1) {
        setSet1TheirScore(validOptions[0]);
      }
    }
  };

  const handleSet1TheirScoreChange = (newScore: number | "") => {
    setSet1TheirScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set1OurScore !== "") {
      if (!isValidRegularSetScore(set1OurScore, newScore)) {
        setSet1OurScore("");
      }
    } else if (newScore !== "" && set1OurScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForRegularSet(newScore);
      if (validOptions.length === 1) {
        setSet1OurScore(validOptions[0]);
      }
    }
  };

  const handleSet2OurScoreChange = (newScore: number | "") => {
    setSet2OurScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set2TheirScore !== "") {
      if (!isValidRegularSetScore(newScore, set2TheirScore)) {
        setSet2TheirScore("");
      }
    } else if (newScore !== "" && set2TheirScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForRegularSet(newScore);
      if (validOptions.length === 1) {
        setSet2TheirScore(validOptions[0]);
      }
    }
  };

  const handleSet2TheirScoreChange = (newScore: number | "") => {
    setSet2TheirScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set2OurScore !== "") {
      if (!isValidRegularSetScore(set2OurScore, newScore)) {
        setSet2OurScore("");
      }
    } else if (newScore !== "" && set2OurScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForRegularSet(newScore);
      if (validOptions.length === 1) {
        setSet2OurScore(validOptions[0]);
      }
    }
  };

  const handleSet3OurScoreChange = (newScore: number | "") => {
    setSet3OurScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set3TheirScore !== "") {
      if (!isValidThirdSetScore(newScore, set3TheirScore)) {
        setSet3TheirScore("");
      }
    } else if (newScore !== "" && set3TheirScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForThirdSet(newScore);
      if (validOptions.length === 1) {
        setSet3TheirScore(validOptions[0]);
      }
    }
  };

  const handleSet3TheirScoreChange = (newScore: number | "") => {
    setSet3TheirScore(newScore);

    // Skip validation for incomplete matches
    if (incompleteReason) return;

    if (newScore !== "" && set3OurScore !== "") {
      if (!isValidThirdSetScore(set3OurScore, newScore)) {
        setSet3OurScore("");
      }
    } else if (newScore !== "" && set3OurScore === "") {
      // Auto-complete if there's only one valid option
      const validOptions = getValidScoresForThirdSet(newScore);
      if (validOptions.length === 1) {
        setSet3OurScore(validOptions[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate that all required fields are filled
    if (!areRequiredFieldsFilled()) {
      setError(`Please ${getSubmissionBlockReason().toLowerCase()}`);
      setSubmitting(false);
      return;
    }

    // Validate that result can be auto-determined
    if (!isResultAutoDetermined()) {
      setError("Please complete the set scores to determine the match result");
      setSubmitting(false);
      return;
    }

    // Validate score combinations before submission (only for complete matches)
    if (!incompleteReason) {
      if (!isValidRegularSetScore(set1OurScore, set1TheirScore)) {
        setError("Set 1 has an invalid score combination");
        setSubmitting(false);
        return;
      }

      if (!isValidRegularSetScore(set2OurScore, set2TheirScore)) {
        setError("Set 2 has an invalid score combination");
        setSubmitting(false);
        return;
      }

      if (
        set3OurScore !== "" &&
        set3TheirScore !== "" &&
        !isValidThirdSetScore(set3OurScore, set3TheirScore)
      ) {
        setError("Set 3 has an invalid score combination");
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/insert-match-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_match_id: teamMatchId,
          is_singles: isSingles,
          pos,
          player1,
          player2: isSingles ? null : player2,
          result: getMatchResult(),
          set1score:
            set1OurScore !== "" && set1TheirScore !== ""
              ? `${set1OurScore}-${set1TheirScore}`
              : "",
          set2score:
            set2OurScore !== "" && set2TheirScore !== ""
              ? `${set2OurScore}-${set2TheirScore}`
              : "",
          set3score:
            set3OurScore !== "" && set3TheirScore !== ""
              ? `${set3OurScore}-${set3TheirScore}`
              : null,
          incomplete_reason: incompleteReason || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit match result");
      }

      setSuccess("Match result submitted successfully!");

      // Reset form (but keep team match selected)
      // setTeamMatchId(""); // Keep team match selected
      setPos(1);
      setPlayer1("");
      setPlayer2("");
      setSet1OurScore("");
      setSet1TheirScore("");
      setSet2OurScore("");
      setSet2TheirScore("");
      setSet3OurScore("");
      setSet3TheirScore("");
      setIncompleteReason("");
      setManualResult("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Input Match Results</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Input Match Results</h2>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary text-primary rounded">
          <div className="flex items-center justify-between">
            <p>{success}</p>
            <Link
              href="/"
              className="text-sm underline hover:text-primary/80 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Match Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Team Match
          </label>
          <select
            value={teamMatchId}
            onChange={(e) => setTeamMatchId(Number(e.target.value) || "")}
            required
            className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">Select a match</option>
            {teamMatches.map((match) => (
              <option key={match.id} value={match.id}>
                {formatMatchDate(match.match_date)} vs {match.opponent_name}
              </option>
            ))}
          </select>
        </div>

        {/* Singles/Doubles Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Match Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={isSingles}
                onChange={() => {
                  setIsSingles(true);
                  setPlayer2("");
                }}
                className="mr-2"
              />
              Singles
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isSingles}
                onChange={() => setIsSingles(false)}
                className="mr-2"
              />
              Doubles
            </label>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Position
          </label>
          <select
            value={pos}
            onChange={(e) => setPos(Number(e.target.value) || "")}
            required
            className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        {/* Player 1 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Player 1
          </label>
          <select
            value={player1}
            onChange={(e) => setPlayer1(Number(e.target.value) || "")}
            required
            className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">Select a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {/* Player 2 (for doubles) */}
        {!isSingles && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Player 2
            </label>
            <select
              value={player2}
              onChange={(e) => setPlayer2(Number(e.target.value) || "")}
              required
              className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">Select a player</option>
              {players
                .filter((p) => p.id !== player1)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Set Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Set 1 Score *
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={set1OurScore}
                onChange={(e) =>
                  handleSet1OurScoreChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
                className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="">Us</option>
                {getScoreOptions(set1TheirScore, false).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <span className="text-muted">-</span>
              <select
                value={set1TheirScore}
                onChange={(e) =>
                  handleSet1TheirScoreChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
                className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="">Them</option>
                {getScoreOptions(set1OurScore, false).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            {set1OurScore !== "" &&
              set1TheirScore !== "" &&
              !incompleteReason &&
              !isValidRegularSetScore(set1OurScore, set1TheirScore) && (
                <p className="text-destructive text-sm mt-1">
                  Invalid score combination
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Set 2 Score *
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={set2OurScore}
                onChange={(e) =>
                  handleSet2OurScoreChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
                className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="">Us</option>
                {getScoreOptions(set2TheirScore, false).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <span className="text-muted">-</span>
              <select
                value={set2TheirScore}
                onChange={(e) =>
                  handleSet2TheirScoreChange(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
                className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="">Them</option>
                {getScoreOptions(set2OurScore, false).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            {set2OurScore !== "" &&
              set2TheirScore !== "" &&
              !incompleteReason &&
              !isValidRegularSetScore(set2OurScore, set2TheirScore) && (
                <p className="text-destructive text-sm mt-1">
                  Invalid score combination
                </p>
              )}
          </div>
          {!shouldHideThirdSet() && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Set 3 Score
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={set3OurScore}
                  onChange={(e) =>
                    handleSet3OurScoreChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Us</option>
                  {getScoreOptions(set3TheirScore, true).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <span className="text-muted">-</span>
                <select
                  value={set3TheirScore}
                  onChange={(e) =>
                    handleSet3TheirScoreChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="flex-1 p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Them</option>
                  {getScoreOptions(set3OurScore, true).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              {set3OurScore !== "" &&
                set3TheirScore !== "" &&
                !incompleteReason &&
                !isValidThirdSetScore(set3OurScore, set3TheirScore) && (
                  <p className="text-destructive text-sm mt-1">
                    Invalid score combination
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Incomplete Reason */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Incomplete Reason (Optional)
          </label>
          <select
            value={incompleteReason}
            onChange={(e) => {
              setIncompleteReason(e.target.value);
              setManualResult(""); // Reset manual result when changing incomplete reason
            }}
            className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">None - Complete Match</option>
            <option value="injury">Injury</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>

        {/* Manual Result Selection */}
        {incompleteReason && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Match Result *
            </label>
            <select
              value={manualResult}
              onChange={(e) => setManualResult(e.target.value)}
              required
              className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">Select result</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="tie">Tie</option>
            </select>
          </div>
        )}

        {/* Result Display */}
        {canSubmit() && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Match Result
            </label>
            <div
              className={`w-full p-3 border rounded-md ${
                getMatchResult() === "win"
                  ? "bg-primary/10 border-primary text-primary"
                  : getMatchResult() === "loss"
                  ? "bg-destructive/10 border-destructive text-destructive"
                  : "bg-accent/10 border-accent text-accent-foreground"
              }`}
            >
              <div className="flex items-center">
                <span className="font-medium capitalize">
                  {getMatchResult()}
                </span>
                <span className="text-sm ml-2 opacity-80">
                  {incompleteReason
                    ? `(Manual - ${incompleteReason})`
                    : "(Auto-determined from set scores)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {!canSubmit() && (
          <div>
            <div className="w-full p-3 bg-accent/10 border border-accent rounded-md">
              <div className="flex items-center">
                <span className="text-accent-foreground text-sm">
                  ⚠️ {getSubmissionBlockReason()} to submit the match result
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !canSubmit()}
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            submitting || !canSubmit()
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {submitting
            ? "Submitting..."
            : !canSubmit()
            ? `${getSubmissionBlockReason()} to Submit`
            : "Submit Match Result"}
        </button>
      </form>
    </div>
  );
}
