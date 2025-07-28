import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
            SELECT * FROM teams
        `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get team:", error);
    return NextResponse.json({ error: "Failed to get team" }, { status: 500 });
  }
}
