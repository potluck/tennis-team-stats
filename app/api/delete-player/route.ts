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
    console.log("Deleting player: ", id);
    await sql`
      DELETE FROM players
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Failed to delete player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
} 