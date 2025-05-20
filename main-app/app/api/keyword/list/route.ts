/**
 * API Route: /api/keyword/list
 *
 * Handles listing of all keywords.
 */

import pool from "@/app/api/lib/db";
import { NextResponse } from "next/server";

/**
 * API handler for listing all keywords.
 * Fetches keywords from the database, aliases column names for frontend compatibility,
 * and returns them in a JSON response.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object.
 *                                 The response body contains a success flag and data (array of keywords)
 *                                 or an error message.
 */
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, keyword, category, created_at AS "createdAt", changed_at AS "changedAt" FROM keyword ORDER BY "createdAt" DESC'
    );

    // Ensure all expected fields are present, even if null from DB, for robust frontend handling.
    const keywords = result.rows.map((kw) => ({
      id: kw.id,
      keyword: kw.keyword || "", // Default to empty string if keyword is null/undefined
      category: kw.category || null, // Default to null if category is null/undefined
      createdAt: kw.createdAt,
      changedAt: kw.changedAt,
    }));

    return NextResponse.json({ success: true, data: keywords }, { status: 200 });
  } catch (error) {
    console.error("Database error fetching keywords:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch keywords from database" },
      { status: 500 }
    );
  }
}
