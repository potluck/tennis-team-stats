import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const result = await sql`
            SELECT * FROM players
        `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get players:", error);
    return NextResponse.json(
      { error: "Failed to get players" },
      { status: 500 }
    );
  }
}
