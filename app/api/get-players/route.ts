import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const players = await sql`SELECT * FROM players ORDER BY name`;
    console.log("Players: ", players.rows);
    return NextResponse.json(players.rows);
  } catch (error) {
    console.error("Failed to get players:", error);
    return NextResponse.json({ error: "Failed to get players" }, { status: 500 });
  }
}
