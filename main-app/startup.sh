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
  
  # Start fresh with an empty file
  > "$env_file" || { echo "Error: Cannot write to $env_file - check permissions"; return 1; }
  
  echo "Gathering all available environment variables..."
  
  # Create an associative array to track variables we've already processed
  declare -A processed_vars
  
  # Define an array of all environment variables we want to pass
  declare -a vars=(
    # API Configuration
    "CHANGEDETECTION_URL"
    
    # Application Configuration
    "NEXT_TELEMETRY_DISABLED"
    "NODE_ENV"
    
    # Database Configuration
    "DATABASE_URL"
    "DB_USER"
    "DB_PASSWORD"
    "DB_NAME"
    "DB_HOST"
    "DB_USE_SSL"
    "DB_REJECT_UNAUTHORIZED"
    "DB_MAX_CONNECTIONS"
    "DB_IDLE_TIMEOUT"
    "DB_CONNECT_TIMEOUT"
    
    # SMTP Configuration
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASSWORD"
    "SMTP_FROM"
    "SMTP_SECURE"
    
    # Proxy Configuration
    "PRIVOXY_PORT"
    "TOR_SOCKS_PORT"
    "TOR_CONTROL_PASSWORD"
    
    # Port Configurations
    "NEXTJS_PORT"
    "CHANGEDETECTION_PORT"
    "POSTGRES_PORT"
    "NGINX_HTTP_PORT"
    "NGINX_HTTPS_PORT"
  )
  
  # Add all NEXT_PUBLIC_ variables
  for var in $(env | grep -o "NEXT_PUBLIC_[^=]*"); do
    vars+=("$var")
  done
  
  # Write all variables to the .env file if they exist, avoiding duplicates
  for var in "${vars[@]}"; do
    # Skip if we've already processed this variable
    [[ -n "${processed_vars[$var]}" ]] && continue
    
    # Mark as processed
    processed_vars[$var]=1
    
    # Get the value using indirect reference
    val="${!var}"
    if [ ! -z "$val" ]; then
      # Handle special case for values with special characters
      if [[ "$val" == *"!"* ]] || [[ "$val" == *"&"* ]] || [[ "$val" == *"#"* ]] || [[ "$val" == *"$"* ]]; then
        # Properly escape special characters for .env file
        echo "$var='$val'" >> "$env_file"
      else
        echo "$var=$val" >> "$env_file"
      fi
      
      # Mask sensitive data in logs
      if [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == *"API_KEY"* ]] || [[ "$var" == "DATABASE_URL" ]]; then
        echo "- $var configured (value hidden)"
      else
        echo "- $var configured: $val"
      fi
    fi
  done
  
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