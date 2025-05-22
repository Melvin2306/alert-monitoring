# Accessing Services in the ChangeDetection.io with Tor Stack

This document explains how to access the different services in the ChangeDetection.io with Tor stack.

## Accessing Services

With the current setup, all services are accessed through the Nginx reverse proxy, which provides a secure entry point with SSL termination.

### Main NextJS Application

The main application is accessible at:

```http
https://your-domain/
```

Or locally:

```http
https://localhost/
```

### ChangeDetection.io Interface

The ChangeDetection.io interface is accessible through its own subdomain:

```http
https://monitor.your-domain/
```

Or locally:

```http
https://monitor.localhost/
```

This approach provides complete isolation for the changedetection app, preventing any CSS or routing conflicts with the main application.

## Port Configuration

All ports are configured in the `.env` file. The key ports are:

- `NGINX_HTTP_PORT`: HTTP port for Nginx (default: 80)
- `NGINX_HTTPS_PORT`: HTTPS port for Nginx (default: 443)
- `CHANGEDETECTION_PORT`: Internal port for ChangeDetection.io (default: 8080)
- `NEXTJS_PORT`: Internal port for the Next.js app (default: 3000)
- `PRIVOXY_PORT`: Internal port for Privoxy proxy (default: 8118)
- `TOR_SOCKS_PORT`: Internal port for Tor SOCKS proxy (default: 9050)
- `POSTGRES_PORT`: Internal port for PostgreSQL (default: 5432, exposed locally as 5433)

These ports are used internally by the Docker services and are not directly exposed to the internet except for the Nginx ports. All other services are accessed through Nginx's reverse proxy functionality.

## SMTP Configuration

Email notifications from the application are configured through environment variables in the `.env` file:

- `SMTP_HOST`: Hostname of the SMTP server
- `SMTP_PORT`: Port of the SMTP server
- `SMTP_USER`: Username for SMTP authentication
- `SMTP_PASSWORD`: Password for SMTP authentication
- `SMTP_FROM`: Email address to use as the sender
- `SMTP_SECURE`: Whether to use secure connection (TLS/SSL)

You can configure these settings by either:

1. Editing the `.env` file directly, or
2. Running the provided setup script:

```bash
./setup-smtp.sh
```

For more detailed instructions, see the [SMTP-SETUP.md](SMTP-SETUP.md) document.

## Troubleshooting

### Port Conflicts

If you encounter errors like:

```bash
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:xxxx -> 127.0.0.1:0: listen tcp 0.0.0.0:xxxx: bind: address already in use
```

It means the port is already in use by another process on your system. To resolve this:

1. Change the port in the `.env` file
2. Restart the stack with `docker compose down` and `docker compose up -d`

### SSL Certificate Issues

If you see SSL certificate warnings, it's because the default setup uses self-signed certificates. To use valid certificates:

1. Replace the certificates in `./nginx/certs/` with your own valid certificates
2. Alternatively, configure Let's Encrypt for automatic certificate management

### Checking Service Status

To check if all services are running properly:

```bash
docker compose ps
```

All services should show as "running".

## Health Checks and Monitoring

The stack includes built-in health checks for all services:

- All services have health checks configured in the Docker Compose file
- Nginx provides health check endpoints at `/health` for both the main domain and monitor subdomain
- Health check timing can be configured using the following environment variables:
  - `HEALTHCHECK_INTERVAL`: Time between health checks
  - `HEALTHCHECK_TIMEOUT`: Timeout for health checks
  - `HEALTHCHECK_RETRIES`: Number of retries before marking a service as unhealthy
  - `DB_HEALTHCHECK_INTERVAL`, `DB_HEALTHCHECK_TIMEOUT`, `DB_HEALTHCHECK_RETRIES`: Specific settings for database health checks

To monitor health status:

```bash
docker compose ps
```

To check service logs for troubleshooting:

```bash
docker compose logs -f [service_name]
```

Where `[service_name]` can be one of: `nginx`, `main-app`, `changedetection`, `playwright-chrome`, `torprivoxy`, or `postgres`.

## Developer Access

For development purposes, some services have additional access points:

### Database Access

The PostgreSQL database is exposed on the local machine:

```properties
Host: 127.0.0.1
Port: 5433 (mapped from container port 5432)
Database: As specified in DB_NAME
User: As specified in DB_USER
Password: As specified in DB_PASSWORD
```

You can connect to it using any PostgreSQL client.

### Tor/Privoxy Access

For development or testing, the Tor services are exposed locally:

```properties
Privoxy HTTP Proxy: 127.0.0.1:${PRIVOXY_PORT} (default: 8118)
Tor SOCKS Proxy: 127.0.0.1:${TOR_SOCKS_PORT} (default: 9050)
Tor Control Port: 127.0.0.1:9051
```

These local ports can be used for testing or directly accessing Tor services.
