/**
 * API Route: /api/keyword
 *
 * Handles keyword management for monitoring and notifications
 */

import pool from "@/app/api/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";

/**
 * GET handler for fetching a specific keyword by ID
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
        {
          success: false,
          message: "Keyword ID is required in query parameters",
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Keyword ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT id, keyword, category, created_at AS "createdAt", changed_at AS "changedAt" FROM keyword WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching keyword:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch keyword" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for adding a new keyword to the database
 *
 * @param {NextRequest} request - The incoming request object containing keyword data
 * @returns {Promise<NextResponse>} JSON response with success/failure status
 * @throws Will return error response if input validation fails or database error occurs
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Limit request size to prevent DOS attacks
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1000) {
      // Basic DOS protection
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { keyword, category } = body as {
      keyword: string;
      category?: string;
    };

    // Validate keyword presence and format
    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Keyword is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Security: Limit keyword length to prevent database/memory issues
    if (keyword.length > 255) {
      return NextResponse.json(
        { success: false, message: "Keyword must be 255 characters or fewer" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && typeof category !== "string") {
      return NextResponse.json(
        { success: false, message: "Category must be a string if provided" },
        { status: 400 }
      );
    }

    // Security: Limit category length to prevent database/memory issues
    if (category && category.length > 100) {
      return NextResponse.json(
        { success: false, message: "Category must be 100 characters or fewer" },
        { status: 400 }
      );
    }

    try {
      const result = await pool.query(
        "INSERT INTO keyword (keyword, category) VALUES ($1, $2) RETURNING id, keyword, category, created_at, changed_at",
        [keyword.trim(), category ? category.trim() : null]
      );

      // Alias for frontend compatibility
      const newKeyword = {
        ...result.rows[0],
        createdAt: result.rows[0].created_at,
        changedAt: result.rows[0].changed_at,
      };
      delete newKeyword.created_at;
      delete newKeyword.changed_at;

      return NextResponse.json({ success: true, data: newKeyword }, { status: 201 });
    } catch (error) {
      if (error instanceof DatabaseError && error.code === "23505") {
        // unique_violation
        // Assuming you might add a unique constraint on (keyword, category) or just keyword
        return NextResponse.json(
          { success: false, message: "This keyword already exists." },
          { status: 409 }
        );
      }
      console.error("Database error saving keyword:", error);
      return NextResponse.json(
        { success: false, message: "Failed to save keyword to database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing keyword addition:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a keyword from the database
 *
 * @param {NextRequest} request - The incoming request object with ID in query params
 * @returns {Promise<NextResponse>} JSON response with success/failure status
 * @throws Will return error response if ID is invalid or database error occurs
 */
/**
 * PUT handler for updating a keyword in the database
 *
 * @param {NextRequest} request - The incoming request containing ID and updated keyword data
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { success: boolean, message: string, data?: object } indicating operation result
 * @throws Will return error response if ID or keyword data is invalid or database error occurs
 */
export async function PUT(request: NextRequest) {
  try {
    // Security: Limit request size to prevent DOS attacks
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { id, keyword, category } = body;

    // Validate ID presence
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Keyword ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Keyword ID format" },
        { status: 400 }
      );
    }

    // Validate keyword presence and format
    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Keyword is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Security: Limit keyword length to prevent database/memory issues
    if (keyword.length > 255) {
      return NextResponse.json(
        { success: false, message: "Keyword must be 255 characters or fewer" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && typeof category !== "string") {
      return NextResponse.json(
        { success: false, message: "Category must be a string if provided" },
        { status: 400 }
      );
    }

    // Security: Limit category length to prevent database/memory issues
    if (category && category.length > 100) {
      return NextResponse.json(
        { success: false, message: "Category must be 100 characters or fewer" },
        { status: 400 }
      );
    }

    // Update the keyword in the database
    try {
      const result = await pool.query(
        'UPDATE keyword SET keyword = $1, category = $2 WHERE id = $3 RETURNING id, keyword, category, created_at AS "createdAt", changed_at AS "changedAt"',
        [keyword.trim(), category ? category.trim() : null, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ success: false, message: "Keyword not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Keyword updated successfully",
          data: result.rows[0],
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Database error during keyword update:", error);
      if (error instanceof DatabaseError && error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "This keyword already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to update keyword in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing keyword update:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process keyword update" },
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
        {
          success: false,
          message: "Keyword ID is required in query parameters",
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Keyword ID format" },
        { status: 400 }
      );
    }

    const result = await pool.query("DELETE FROM keyword WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Keyword deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing keyword deletion:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
