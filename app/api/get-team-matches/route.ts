import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
            SELECT * FROM team_matches
            ORDER BY match_date DESC
        `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get team matches:", error);
    return NextResponse.json(
      { error: "Failed to get team matches" },
      { status: 500 }
    );
  }
}
