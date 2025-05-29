/**
 * API Route: /api/email
 *
 * Handles email subscription requests for notification services
 */

import pool from "@/app/api/lib/db"; // Import the pg pool
import type { EmailRequestBody, EmailUpdateRequestBody } from "@/app/api/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg"; // Import DatabaseError

/**
 * GET handler for fetching a specific email by ID
 *
 * @param {NextRequest} request - The incoming request object containing ID in query params
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { success: boolean, data?: object } or { success: boolean, message: string } on error
 * @throws Will return error response if ID is invalid or database error occurs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Email ID is required in query parameters" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Email ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT id, email_address AS email, created_at AS "createdAt", changed_at AS "changedAt" FROM email WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch email" }, { status: 500 });
  }
}

/**
 * POST handler for adding a new email subscription
 *
 * @param {NextRequest} request - The incoming request object containing email data
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { success: boolean, message: string, data?: object } or { success: boolean, message: string } on error
 * @throws Will return error response if email validation fails or database error occurs
 */
export async function POST(request: NextRequest) {
  try {
    // Limit request size to prevent DOS attacks
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1000) {
      return NextResponse.json(
        { success: false, message: "Request body too large" },
        { status: 413 }
      );
    }

    // Check content type to protect against injection attacks
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // Parse and validate request body
    let body: EmailRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const email = body.email;

    // Validate email presence
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // Validate email type
    if (typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email must be a string" },
        { status: 400 }
      );
    }

    // Stronger email format validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 320) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format or length exceeds 320 characters",
        },
        { status: 400 }
      );
    }

    // Save the email to the database using pg
    try {
      const result = await pool.query(
        "INSERT INTO email (email_address) VALUES ($1) RETURNING id, email_address, created_at, changed_at",
        [email]
      );

      return NextResponse.json({
        success: true,
        message: "Email subscription saved successfully",
        data: result.rows[0],
      });
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.code === "23505" &&
        error.constraint === "email_email_address_key"
      ) {
        return NextResponse.json(
          { success: false, message: "Email address already subscribed" },
          { status: 409 } // Conflict
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save email subscription to database",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing an email subscription
 *
 * @param {NextRequest} request - The incoming request object containing ID in query params
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { success: boolean, message: string } indicating operation result
 * @throws Will return error response if ID is invalid or database error occurs
 */
/**
 * PUT handler for updating an email subscription
 *
 * @param {NextRequest} request - The incoming request containing ID and new email data
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { success: boolean, message: string, data?: object } indicating operation result
 * @throws Will return error response if ID or email is invalid or database error occurs
 */
export async function PUT(request: NextRequest) {
  try {
    // Limit request size to prevent DOS attacks
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1000) {
      return NextResponse.json(
        { success: false, message: "Request body too large" },
        { status: 413 }
      );
    }

    // Check content type to protect against injection attacks
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // Parse and validate request body
    let body: EmailUpdateRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { id, email } = body;

    // Validate ID presence
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Email ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Email ID format" },
        { status: 400 }
      );
    }

    // Validate email presence
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // Validate email type
    if (typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email must be a string" },
        { status: 400 }
      );
    }

    // Stronger email format validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 320) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format or length exceeds 320 characters",
        },
        { status: 400 }
      );
    }

    // Update the email in the database
    try {
      const result = await pool.query(
        'UPDATE email SET email_address = $1 WHERE id = $2 RETURNING id, email_address AS email, created_at AS "createdAt", changed_at AS "changedAt"',
        [email, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Email updated successfully",
          data: result.rows[0],
        },
        { status: 200 }
      );
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.code === "23505" &&
        error.constraint === "email_email_address_key"
      ) {
        return NextResponse.json(
          { success: false, message: "Email address already exists" },
          { status: 409 } // Conflict
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to update email in database" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to process email update" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Email ID is required in query parameters" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Email ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query("DELETE FROM email WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Email deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to delete email" },
      { status: 500 }
    );
  }
}
