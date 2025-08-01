import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, team_id } = await request.json();

    if (!name || !team_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO players (name, team_id)
      OVERRIDING SYSTEM VALUE
      VALUES (${name}, ${team_id})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Object && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { error: `A player with that name already exists.` },
        { status: 409 }
      );
    }
    console.error("Failed to add player:", error);
    return NextResponse.json(
      { error: "Failed to add player" },
      { status: 500 }
    );
  }
} 