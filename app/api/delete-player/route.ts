import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT 1 FROM match_results WHERE player1 = ${id} OR player2 = ${id} LIMIT 1
    `;

    if (result.rowCount && result.rowCount > 0) {
      await sql`
        UPDATE players SET is_deleted = true WHERE id = ${id}
      `;
      return NextResponse.json({
        message: "Player marked as deleted because they are in a match",
      });
    } else {
      await sql`
        DELETE FROM players
        WHERE id = ${id}
      `;
      return NextResponse.json({ message: "Player deleted successfully" });
    }
  } catch (error) {
    console.error("Failed to delete player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
} 