#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NGINX SSL Certificate Generation ===${NC}"
echo "Creating self-signed SSL certificates for secure HTTPS connections."

# Create necessary directories with proper permissions
echo -e "${BLUE}Creating required directories...${NC}"
mkdir -p ./certs
mkdir -p ./conf
mkdir -p ./logs

# Generate self-signed certificates
echo -e "${BLUE}Generating SSL certificates...${NC}"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/server.key \
  -out ./certs/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName = DNS:localhost,DNS:monitor.localhost,DNS:*.localhost,IP:127.0.0.1"

# Set proper permissions
echo -e "${BLUE}Setting appropriate permissions...${NC}"
chmod 600 ./certs/server.key
chmod 644 ./certs/server.crt

# Create logs directory with proper permissions for non-root NGINX
mkdir -p ./logs/nginx
touch ./logs/nginx/access.log ./logs/nginx/error.log
chmod -R 777 ./logs  # This allows nginx user to write logs

echo -e "${GREEN}Self-signed certificates generated successfully in ./certs/${NC}"
echo -e "${YELLOW}Note: Since these are self-signed certificates, browsers will show a security warning.${NC}"
echo -e "You can add an exception in your browser or import the certificate to your system trust store."