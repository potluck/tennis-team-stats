import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await sql`SELECT * FROM teams`;
    return NextResponse.json(teams.rows);
  } catch (error) {
    console.error("Failed to get team:", error);
    return NextResponse.json({ error: "Failed to get team" }, { status: 500 });
  }
}
