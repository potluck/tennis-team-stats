import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

const getMatchPointsSQL = `
  CREATE OR REPLACE FUNCTION get_match_points(pos integer, is_singles boolean)
  RETURNS integer AS $$
  BEGIN
    IF is_singles THEN
      RETURN CASE WHEN pos = 1 THEN 5 ELSE 4 END;
    ELSE
      RETURN CASE 
        WHEN pos = 1 THEN 5
        WHEN pos = 2 THEN 4
        ELSE 3
      END;
    END IF;
  END;
  $$ LANGUAGE plpgsql;
`;

export async function GET() {
  try {
    // Create the function if it doesn't exist
    await sql.query(getMatchPointsSQL);

    const result = await sql`
      WITH match_points AS (
        SELECT 
          mr.team_match_id,
          CASE 
            WHEN mr.result = 'win' THEN get_match_points(mr.pos, mr.is_singles)
            WHEN mr.result = 'tie' THEN get_match_points(mr.pos, mr.is_singles) / 2
            ELSE 0
          END as our_points,
          CASE 
            WHEN mr.result = 'loss' THEN get_match_points(mr.pos, mr.is_singles)
            WHEN mr.result = 'tie' THEN get_match_points(mr.pos, mr.is_singles) / 2
            ELSE 0
          END as their_points
        FROM match_results mr
      )
      SELECT 
        tm.*,
        COALESCE(SUM(mp.our_points), 0) as our_points,
        COALESCE(SUM(mp.their_points), 0) as their_points
      FROM team_matches tm
      LEFT JOIN match_points mp ON tm.id = mp.team_match_id
      GROUP BY tm.id, tm.match_date, tm.opponent_name, tm.team_id
      ORDER BY tm.match_date ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get team matches:", error);
    return NextResponse.json({ error: "Failed to get team matches" }, { status: 500 });
  }
}
