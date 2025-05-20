-- ----------------------------------------------------------------------
-- ALERT Database Initialization Script
-- ----------------------------------------------------------------------
-- Purpose: Initialize database schema for the ALERT application
-- This script creates tables for storing emails and keywords with proper
-- auditing fields and automatic timestamp updates.
-- ----------------------------------------------------------------------

-- Enable UUID generation capability
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------
-- Timestamp Update Function
-- ----------------------------------------------------------------------
-- Updates the changed_at timestamp automatically whenever a record is modified
-- This ensures accurate auditing of when records were last changed
CREATE OR REPLACE FUNCTION update_changed_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.changed_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ----------------------------------------------------------------------
-- Email Table
-- ----------------------------------------------------------------------
-- Stores email addresses for notifications and subscriptions
-- Uses UUID for primary key to enhance security and prevent enumeration attacks
CREATE TABLE IF NOT EXISTS email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_address VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Add index on email_address for faster lookups
    CONSTRAINT email_address_lower_idx UNIQUE (LOWER(email_address))
);

-- Create a trigger to call the function before update on email table
CREATE TRIGGER update_email_changed_at
BEFORE UPDATE ON email
FOR EACH ROW
EXECUTE FUNCTION update_changed_at_column();

-- ----------------------------------------------------------------------
-- Keyword Table
-- ----------------------------------------------------------------------
-- Stores keywords for ALERT monitoring
-- Each keyword can be categorized for better organization
CREATE TABLE IF NOT EXISTS keyword (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Add index on keyword for faster searches
    CONSTRAINT keyword_unique_idx UNIQUE (keyword)
);

-- Create a trigger to call the function before update on keyword table
CREATE TRIGGER update_keyword_changed_at
BEFORE UPDATE ON keyword
FOR EACH ROW
EXECUTE FUNCTION update_changed_at_column();
