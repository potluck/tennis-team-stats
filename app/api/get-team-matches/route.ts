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

interface CreateTeamMatchRequest {
  opponent_name: string;
  match_date: string;
}

export async function POST(request: Request) {
  try {
    const { opponent_name, match_date } = await request.json() as CreateTeamMatchRequest;

    // Insert the new team match
    const result = await sql`
      INSERT INTO team_matches (opponent_name, match_date)
      VALUES (${opponent_name}, ${match_date})
      RETURNING id
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create team match. Full error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Create the function if it doesn't exist
    await sql.query(getMatchPointsSQL);

    const result = await sql`
      WITH match_points AS (
        SELECT 
          mr.team_match_id,
          mr.is_singles,
          mr.pos,
          mr.result,
          mr.player1,
          mr.player2,
          mr.set1score,
          mr.set2score,
          mr.set3score,
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
      ),
      aggregated_points AS (
        SELECT 
          team_match_id,
          SUM(our_points) as total_our_points,
          SUM(their_points) as total_their_points
        FROM match_points
        GROUP BY team_match_id
      ),
      position_results AS (
        SELECT 
          mp.team_match_id,
          jsonb_agg(
            jsonb_build_object(
              'is_singles', mp.is_singles,
              'pos', mp.pos,
              'result', mp.result,
              'player1', COALESCE(p1.name, ''),
              'player2', COALESCE(p2.name, ''),
              'set1_score', mp.set1score,
              'set2_score', mp.set2score,
              'set3_score', mp.set3score
            ) ORDER BY mp.is_singles DESC, mp.pos ASC
          ) as position_results
        FROM match_points mp
        LEFT JOIN players p1 ON mp.player1 = p1.id
        LEFT JOIN players p2 ON mp.player2 = p2.id
        GROUP BY mp.team_match_id
      )
      SELECT 
        tm.*,
        COALESCE(ap.total_our_points, 0) as our_points,
        COALESCE(ap.total_their_points, 0) as their_points,
        COALESCE(pr.position_results, '[]'::jsonb) as position_results
      FROM team_matches tm
      LEFT JOIN aggregated_points ap ON tm.id = ap.team_match_id
      LEFT JOIN position_results pr ON tm.id = pr.team_match_id
      ORDER BY tm.match_date ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to get team matches. Full error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    // Delete match results first (due to foreign key constraint)
    await sql`
      DELETE FROM match_results 
      WHERE team_match_id = ${matchId}
    `;

    // Then delete the team match
    await sql`
      DELETE FROM team_matches 
      WHERE id = ${matchId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team match. Full error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
