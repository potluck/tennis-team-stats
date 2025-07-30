import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { teamId, name } = await request.json();
    
    const result = await sql`
      UPDATE teams 
      SET name = ${name}
      WHERE id = ${teamId}
      RETURNING *
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update team name:", error);
    return NextResponse.json(
      { error: "Failed to update team name" },
      { status: 500 }
    );
  }
} 