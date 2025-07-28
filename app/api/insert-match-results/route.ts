import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      team_match_id,
      is_singles,
      pos,
      player1,
      player2,
      result,
      set1score,
      set2score,
      set3score,
    } = body;

    // Validate required fields
    if (
      !team_match_id ||
      pos === undefined ||
      !player1 ||
      !result ||
      !set1score ||
      !set2score
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate pos is between 1 and 3
    if (pos < 1 || pos > 3) {
      return NextResponse.json(
        { error: "Position must be between 1 and 3" },
        { status: 400 }
      );
    }

    // Validate result is one of the allowed values
    if (!["win", "tie", "loss"].includes(result)) {
      return NextResponse.json(
        { error: "Result must be win, tie, or loss" },
        { status: 400 }
      );
    }

    // For doubles, player2 is required
    if (!is_singles && !player2) {
      return NextResponse.json(
        { error: "Player 2 is required for doubles matches" },
        { status: 400 }
      );
    }

    // Insert the match result
    const insertResult = await sql`
      INSERT INTO match_results (
        team_match_id,
        is_singles,
        pos,
        player1,
        player2,
        result,
        set1score,
        set2score,
        set3score
      ) VALUES (
        ${team_match_id},
        ${is_singles},
        ${pos},
        ${player1},
        ${player2 || null},
        ${result},
        ${set1score},
        ${set2score},
        ${set3score || null}
      )
      RETURNING *
    `;

    return NextResponse.json(insertResult.rows[0]);
  } catch (error) {
    console.error("Failed to insert match result:", error);
    return NextResponse.json(
      { error: "Failed to insert match result" },
      { status: 500 }
    );
  }
}
