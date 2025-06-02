#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SMTP Configuration Setup ===${NC}"
echo "This script will help you set up the SMTP configuration for your application."
echo "The credentials will be saved to a .env file which will be used by docker-compose."
echo "Press Enter to skip any field you don't want to change."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="${SCRIPT_DIR}/.env"

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo "Created new .env file"
fi

# Function to update a value in the .env file
update_env_value() {
    local key=$1
    local value=$2
    
    if [ -z "$value" ]; then
        return
    fi
    
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Replace existing value
        sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
        # Add new key-value pair
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# Function to validate email address format
validate_email() {
    local email=$1
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# Function to validate port number
validate_port() {
    local port=$1
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
        return 1
    fi
    return 0
}

# Function to provide common SMTP configurations
select_smtp_provider() {
    echo -e "${BLUE}Common SMTP Providers:${NC}"
    echo "1) Gmail (smtp.gmail.com:587)"
    echo "2) Outlook/Office 365 (smtp.office365.com:587)"
    echo "3) Yahoo (smtp.mail.yahoo.com:587)"
    echo "4) Amazon SES (email-smtp.us-east-1.amazonaws.com:587)"
    echo "5) SendGrid (smtp.sendgrid.net:587)"
    echo "6) Custom"
    echo ""
    
    read -p "Select provider (1-6, default is 6): " provider_choice
    
    case $provider_choice in
        1)
            echo -e "${YELLOW}Using Gmail SMTP${NC}"
            echo "Note: For Gmail, you need to use an App Password if you have 2-factor authentication enabled."
            echo "Visit https://myaccount.google.com/apppasswords to generate one."
            smtp_host="smtp.gmail.com"
            smtp_port="587"
            smtp_secure="false"
            ;;
        2)
            echo -e "${YELLOW}Using Outlook/Office 365 SMTP${NC}"
            smtp_host="smtp.office365.com"
            smtp_port="587"
            smtp_secure="false"
            ;;
        3)
            echo -e "${YELLOW}Using Yahoo SMTP${NC}"
            smtp_host="smtp.mail.yahoo.com"
            smtp_port="587"
            smtp_secure="false"
            ;;
        4)
            echo -e "${YELLOW}Using Amazon SES SMTP${NC}"
            smtp_host="email-smtp.us-east-1.amazonaws.com"
            smtp_port="587"
            smtp_secure="false"
            ;;
        5)
            echo -e "${YELLOW}Using SendGrid SMTP${NC}"
            smtp_host="smtp.sendgrid.net"
            smtp_port="587"
            smtp_secure="false"
            ;;
        6|*)
            echo -e "${YELLOW}Using Custom SMTP Configuration${NC}"
            read -p "SMTP Host (e.g. smtp.gmail.com): " smtp_host
            
            # Port validation
            while true; do
                read -p "SMTP Port (e.g. 587, press Enter for default 587): " smtp_port
                if [ -z "$smtp_port" ]; then
                    smtp_port="587" # Default value
                    break
                elif validate_port "$smtp_port"; then
                    break
                else
                    echo -e "${RED}Error: Please enter a valid port number (1-65535)${NC}"
                fi
            done
            
            read -p "SMTP Secure (true/false, default is false): " smtp_secure
            if [ -z "$smtp_secure" ]; then
                smtp_secure="false"
            fi
            ;;
    esac
}

# Start SMTP Configuration
echo -e "${GREEN}SMTP Configuration${NC}"

# Ask for provider selection
select_smtp_provider

# Get username (if not already set)
if [ -z "$smtp_user" ]; then
    read -p "SMTP Username: " smtp_user
fi

# Get password (if not already set)
read -p "SMTP Password: " -s smtp_pass
echo ""

# From email validation
while true; do
    read -p "SMTP From Email (e.g. notifications@example.com): " smtp_from
    if [ -z "$smtp_from" ]; then
        echo -e "${RED}Error: From email is required${NC}"
    elif validate_email "$smtp_from"; then
        break
    else
        echo -e "${RED}Error: Please enter a valid email address${NC}"
    fi
done

# Update .env file
echo -e "${YELLOW}Updating .env file...${NC}"
update_env_value "SMTP_HOST" "$smtp_host"
update_env_value "SMTP_PORT" "$smtp_port"
update_env_value "SMTP_USER" "$smtp_user"
update_env_value "SMTP_PASSWORD" "$smtp_pass"
update_env_value "SMTP_FROM" "$smtp_from"
update_env_value "SMTP_SECURE" "$smtp_secure"

echo -e "${GREEN}SMTP configuration has been saved to .env file.${NC}"

# Ask if user wants to apply the SMTP configuration
read -p "Would you like to apply the SMTP configuration now? (Y/n): " apply_smtp
if [[ $apply_smtp =~ ^[Yy]$ ]] || [ -z "$apply_smtp" ]; then
    echo -e "${YELLOW}Applying SMTP configuration...${NC}"
    echo "This will recreate the main-app container to apply the new environment variables."
    
    # Check if docker is available
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        # Stop and recreate the main-app container to pick up new environment variables
        echo -e "${BLUE}Stopping main-app container...${NC}"
        docker compose stop main-app
        
        echo -e "${BLUE}Recreating main-app container with new environment variables...${NC}"
        docker compose up -d main-app
        
        # Wait a moment for the container to start
        sleep 5
        
        # Check if the container is running
        if docker compose ps main-app | grep -q "Up"; then
            echo -e "${GREEN}✅ The main-app container has been successfully recreated with the new SMTP settings.${NC}"
            echo -e "${GREEN}You can now test your email configuration by sending a test email from the settings page.${NC}"
            echo ""
            echo -e "${BLUE}💡 Tip: You can view the container logs with:${NC}"
            echo "docker compose logs -f main-app"
        else
            echo -e "${RED}❌ Failed to start the main-app container. Checking logs...${NC}"
            docker compose logs --tail=20 main-app
        fi
    else
        echo -e "${RED}Docker or docker-compose is not available. Please apply the changes manually:${NC}"
        echo ""
        echo "1. Stop the container:"
        echo "   docker compose stop main-app"
        echo ""
        echo "2. Recreate the container with new environment variables:"
        echo "   docker compose up -d main-app"
        echo ""
        echo "3. Check the container status:"
        echo "   docker compose ps main-app"
    fi
else
    echo -e "${YELLOW}SMTP configuration saved but not applied.${NC}"
    echo -e "${YELLOW}To apply the changes later, run:${NC}"
    echo ""
    echo "docker compose stop main-app"
    echo "docker compose up -d main-app"
fi

echo -e "${GREEN}Setup complete!${NC}"