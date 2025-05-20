/**
 * API Route: /api/email/list
 *
 * Handles listing of all email subscriptions
 */

import pool from "@/app/api/lib/db"; // Import the pg pool
import { NextResponse } from "next/server";

/**
 * API handler for listing all email subscriptions
 * @returns {Promise<NextResponse>}
 */
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, email_address AS email, created_at AS "createdAt", changed_at AS "changedAt" FROM email ORDER BY "createdAt" DESC'
    );

    // pg already returns Date objects for TIMESTAMPTZ,
    // NextResponse.json will handle their serialization to ISO strings.
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching email subscriptions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch email subscriptions" },
      { status: 500 }
    );
  }
}
