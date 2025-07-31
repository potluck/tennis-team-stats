import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

interface MatchResult {
  is_singles: boolean;
  pos: number;
  result: "win" | "loss" | "tie";
  player1: string;
  player2: string | null;
  set1_score: string| null;
  set2_score: string | null;
  set3_score: string | null;
  incomplete_reason: "timeout" | "injury" | "default" | null;
}

interface UpdateMatchRequest {
  matchId: number;
  results: MatchResult[];
}

export async function POST(request: Request) {
  try {
    const { matchId, results } = await request.json() as UpdateMatchRequest;

    // Update each position's scores and players
    await Promise.all(results.map(async (result: MatchResult) => {
      // First get the player IDs
      const player1Result = await sql`
        SELECT id FROM players WHERE name = ${result.player1}
      `;
      const player1Id = player1Result.rows[0]?.id;

      let player2Id = null;
      if (result.player2) {
        const player2Result = await sql`
          SELECT id FROM players WHERE name = ${result.player2}
        `;
        player2Id = player2Result.rows[0]?.id;
      }

      // Check if this match result already exists
      const existingResult = await sql`
        SELECT id FROM match_results 
        WHERE team_match_id = ${matchId} 
        AND is_singles = ${result.is_singles} 
        AND pos = ${result.pos}
      `;

      if (existingResult.rows.length > 0) {
        // Update existing match result
        await sql`
          UPDATE match_results
          SET 
            set1score = ${result.set1_score},
            set2score = ${result.set2_score},
            set3score = ${result.set3_score},
            incomplete_reason = ${result.incomplete_reason || null},
            player1 = ${player1Id},
            player2 = ${player2Id},
            result = ${result.result}
          WHERE 
            team_match_id = ${matchId}
            AND is_singles = ${result.is_singles}
            AND pos = ${result.pos}
        `;
      } else {
        // Insert new match result
        await sql`
          INSERT INTO match_results (
            team_match_id,
            is_singles,
            pos,
            set1score,
            set2score,
            set3score,
            incomplete_reason,
            player1,
            player2,
            result
          ) VALUES (
            ${matchId},
            ${result.is_singles},
            ${result.pos},
            ${result.set1_score},
            ${result.set2_score},
            ${result.set3_score},
            ${result.incomplete_reason || null},
            ${player1Id},
            ${player2Id},
            ${result.result}
          )
        `;
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update match scores:", error);
    return NextResponse.json(
      { error: "Failed to update match scores" },
      { status: 500 }
    );
  }
} 