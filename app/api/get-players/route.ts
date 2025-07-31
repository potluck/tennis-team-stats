import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name
      FROM players
      ORDER BY name ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get players:", error);
    return NextResponse.json({ error: "Failed to get players" }, { status: 500 });
  }
}
