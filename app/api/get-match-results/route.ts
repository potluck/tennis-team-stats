import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        mr.*,
        p1.name as player1_name,
        p2.name as player2_name,
        tm.match_date,
        tm.opponent_name
      FROM match_results mr
      LEFT JOIN players p1 ON mr.player1 = p1.id
      LEFT JOIN players p2 ON mr.player2 = p2.id
      LEFT JOIN team_matches tm ON mr.team_match_id = tm.id
      ORDER BY tm.match_date DESC, mr.pos ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get match results:", error);
    return NextResponse.json(
      { error: "Failed to get match results" },
      { status: 500 }
    );
  }
}
