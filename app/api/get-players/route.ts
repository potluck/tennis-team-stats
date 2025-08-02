import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET() {
  noStore();
  try {
    const players = await sql`SELECT * FROM players ORDER BY name`;
    return NextResponse.json( players.rows );
  } catch (error) {
    console.error("Failed to get players:", error);
    return NextResponse.json({ error: "Failed to get players" }, { status: 500 });
  }
}
