#!/bin/bash

# Function to update environment variables in .env file
update_env_file() {
  local env_file="/app/.env"
  
  echo "Checking environment file configuration..."
  # Create .env file if it doesn't exist
  if [ ! -f "$env_file" ]; then
    echo "Creating new environment file at $env_file"
    touch "$env_file" || { echo "Error: Failed to create $env_file - check permissions"; return 1; }
    chmod 644 "$env_file" || { echo "Error: Failed to set permissions on $env_file"; return 1; }
  else
    echo "Environment file exists, updating configuration..."
  fi

  # Create a new temporary file content in memory
  local new_env_content=""
  
  # Function to add a variable to our new content only if it doesn't exist
  add_env_var() {
    local key=$1
    local value=$2
    
    # Add the key-value pair to our content
    new_env_content="${new_env_content}${key}=${value}
"
  }
  
  # Start fresh with an empty file
  > "$env_file" || { echo "Error: Cannot write to $env_file - check permissions"; return 1; }
  
  # Update SMTP variables by writing directly to the file
  echo "Configuring email (SMTP) settings..."
  if [ ! -z "$SMTP_HOST" ]; then
    echo "SMTP_HOST=$SMTP_HOST" >> "$env_file"
    echo "- SMTP host configured"
  fi
  
  if [ ! -z "$SMTP_PORT" ]; then
    echo "SMTP_PORT=$SMTP_PORT" >> "$env_file"
    echo "- SMTP port configured"  
  fi
  
  if [ ! -z "$SMTP_USER" ]; then
    echo "SMTP_USER=$SMTP_USER" >> "$env_file"
    echo "- SMTP username configured"
  fi
  
  if [ ! -z "$SMTP_PASSWORD" ]; then
    echo "SMTP_PASSWORD=$SMTP_PASSWORD" >> "$env_file"
    echo "- SMTP password configured (value hidden)"
  fi
  
  if [ ! -z "$SMTP_FROM" ]; then
    echo "SMTP_FROM=$SMTP_FROM" >> "$env_file"
    echo "- SMTP from address configured"
  fi
  
  if [ ! -z "$SMTP_SECURE" ]; then
    echo "SMTP_SECURE=$SMTP_SECURE" >> "$env_file"
    echo "- SMTP secure connection set to: $SMTP_SECURE"
  fi
  
  # Make sure we keep other important variables from environment
  echo "Configuring database connection..."
  if [ ! -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL=$DATABASE_URL" >> "$env_file"
    echo "- Database connection configured (connection string hidden)"
  else
    echo "- No database URL provided, skipping database configuration"
  fi
  
  echo "Configuring ChangeDetection service..."
  if [ ! -z "$CHANGEDETECTION_URL" ]; then
    echo "CHANGEDETECTION_URL=$CHANGEDETECTION_URL" >> "$env_file"
    echo "- ChangeDetection service URL configured: $CHANGEDETECTION_URL"
  else
    echo "- No ChangeDetection URL provided"
  fi
  
  if [ ! -z "$CHANGEDETECTION_API_KEY" ]; then
    echo "CHANGEDETECTION_API_KEY=$CHANGEDETECTION_API_KEY" >> "$env_file"
    echo "- ChangeDetection API key configured (key hidden)"
  else
    echo "- No ChangeDetection API key provided"
  fi
  
  echo "✅ Environment configuration completed successfully"
}

# Display startup banner
echo "==============================================="
echo "   ChangeDetection.io TOR Proxy Service        "
echo "==============================================="
echo "Starting initialization process..."

# Update the environment file
update_env_file

# Start the Next.js application
echo ""
echo "🚀 Starting Next.js application..."
echo "==============================================="
node server.js