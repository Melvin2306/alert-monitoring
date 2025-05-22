# Network Architecture Documentation

## Overview

This document describes the network architecture of the ChangeDetectionIO-Tor stack, designed with security and isolation in mind. The architecture follows the principle of least privilege, ensuring that each service only has access to the networks it needs to function properly.

## Network Segmentation

The application uses the following isolated networks:

1. **tor_network**: Allows Tor proxy to communicate with the outside world
   - Connected services: `torprivoxy`

2. **proxy_network**: Internal network for services that need Tor proxy access
   - Connected services: `torprivoxy`, `changedetection`, `playwright-chrome`

3. **browser_network**: Network for browser and change detection communication
   - Connected services: `playwright-chrome`, `changedetection`

4. **change_network**: Network for the main app to communicate with change detection
   - Connected services: `changedetection`, `main-app`, `nginx`

5. **db_network**: Isolated network for database connectivity
   - Connected services: `postgres`, `main-app`

6. **public_network**: Public-facing network for nginx
   - Connected services: `nginx`

## Service Access Restrictions

### Nginx (Public Entry Point)

- Public-facing service
- Only service directly exposed to the internet
- Reverse proxies requests to `main-app` (port 3000) and `changedetection` (port 5000)
- Handles SSL termination for all services
- Provides health check endpoints at `/health`

### Main-App

- Not directly exposed to the internet
- Can only communicate with:
  - `postgres` (through `db_network`)
  - `changedetection` (through `change_network`)
  - `nginx` (through `change_network`)

### Change Detection

- Not directly exposed to the internet
- Accessible through Nginx on subdomain `monitor.*`
- Can communicate with:
  - `main-app` (through `change_network`)
  - `playwright-chrome` (through `browser_network`)
  - `torprivoxy` (through `proxy_network`)
  - `nginx` (through `change_network`)
- Configured with Tor proxy for accessing .onion sites and enhanced privacy

### Playwright-Chrome

- Isolated browser service
- Can only communicate with:
  - `changedetection` (through `browser_network`)
  - `torprivoxy` (through `proxy_network`)
- Configured with stealth mode and ad blocking for privacy
- Uses special Chrome flags to handle Tor connectivity and .onion sites
- Runs in a temporary filesystem for enhanced security

### Postgres Database

- Highly isolated database
- Can only communicate with:
  - `main-app` (through `db_network`)
- Port 5432 is only exposed on localhost (127.0.0.1:5433)
- Protected with secure authentication (scram-sha-256)
- Health checks ensure database availability

### TorPrivoxy

- Bridge to the outside world for .onion access
- Can communicate with:
  - Outside world (through `tor_network`)
  - `changedetection` and `playwright-chrome` (through `proxy_network`)
- Ports 8118 (Privoxy), 9050 (Tor SOCKS), and 9051 (Tor Control) are only exposed on localhost
- Configured for enhanced performance with .onion sites

## Security Benefits

1. **Database Isolation**: The PostgreSQL database is only accessible by the main application.

2. **No Direct Service Exposure**: None of the internal services are directly exposed to the internet.

3. **Controlled Internet Access**: Only Tor proxy can access the internet directly (apart from nginx for inbound connections).

4. **Principle of Least Privilege**: Each service has access only to the networks it needs to function.

5. **Segmented Attack Surface**: A compromise of one service doesn't automatically grant access to all services.

## Network Flow Diagram

```ascii
Internet
   │
   ▼
 Nginx ───────────────┐
   │                  │
   │                  │
   ▼                  ▼
Main-App        ChangeDetection
   │                  │
   │                  ▼
   │           Playwright-Chrome
   │                  │
   │                  │
   ▼                  ▼
Postgres        TorPrivoxy
                     │
                     ▼
                 Internet
```

## Notes

- The Tor network is configured to handle .onion sites effectively
- Nginx handles SSL termination and provides a secure entry point
- All internal communication happens over isolated Docker networks
- The database is completely isolated from the internet and other services except the main app
- SMTP configuration is handled through environment variables and available to the main-app service
- Health checks are implemented for all services to ensure proper functioning

## Accessing Services

All services are accessed through the Nginx reverse proxy using subdomains for better isolation:

- Main application: `https://your-domain/` or `https://localhost/`
- ChangeDetection UI: `https://monitor.your-domain/` or `https://monitor.localhost/`

For more detailed information about accessing services, please see the [ACCESS.md](ACCESS.md) document.
