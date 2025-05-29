# ChangeDetection.io with Tor

This Docker Compose stack provides a [changedetection.io](https://github.com/dgtlmoon/changedetection.io) instance with [Playwright](https://github.com/microsoft/playwright) browser steps support and ready to use configuration for using [Tor](https://www.torproject.org/) for all your watches, including special optimizations for .onion sites.

## Getting Started

1. Clone this repository
2. Copy the `.env.example` file to `.env` and customize values:

   ```bash
   cp .env.example .env
   nano .env  # Edit settings as needed
   ```

3. Start the stack:

   ```bash
   docker compose up -d
   ```

4. Access the services:

   - Main UI: [https://localhost](https://localhost)
   - ChangeDetection UI: [https://monitor.localhost](https://monitor.localhost)

   For more details on accessing services, see [ACCESS.md](ACCESS.md).

## Network Architecture

This stack uses a secure, isolated network architecture with the following design principles:

- **Nginx** is the only publicly accessible service
- **Postgres** database is isolated and can only communicate with the main app
- **Playwright** browser can only connect to changedetection and torprivoxy
- **Torprivoxy** has access to the outside world to connect to Tor network
- All internal services use isolated Docker networks for secure communication

For more details, see the [NETWORK.md](docs/NETWORK.md) documentation and view the [network diagram](docs/network-diagram.mmd).

## Resource Configuration

This stack includes individual resource limits for each service to ensure optimal performance and prevent resource exhaustion. The default limits are configured as follows:

| Service | Memory Limit | CPU Limit | Purpose |
|---------|-------------|-----------|---------|
| ChangeDetection | 512M | 0.5 | Main monitoring service - adequate for watch processing |
| PostgreSQL | 256M | 0.2 | Database - typically uses minimal resources |
| Tor/Privoxy | 256M | 0.2 | Proxy service - minimal for proxy operations |
| Browser (Playwright) | 768M | 0.8 | Browser automation - needs substantial memory |
| Nginx | 128M | 0.1 | Reverse proxy - very lightweight |
| Next.js App | 256M | 0.3 | Web interface - reasonable for Node.js app |

### Customizing Resource Limits

You can adjust these limits in your `.env` file based on your system specifications and usage patterns:

```bash
# Example: Increase changedetection memory for heavy workloads
MEMORY_LIMIT_CHANGEDETECTION=1G
CPU_LIMIT_CHANGEDETECTION=1.0

# Example: Reduce browser resources for lighter usage
MEMORY_LIMIT_BROWSER=512M
CPU_LIMIT_BROWSER=0.5
```

**Guidelines for adjustment:**

- **ChangeDetection**: Increase if monitoring many sites or using complex selectors
- **Browser**: Increase if experiencing timeouts or memory issues with JavaScript-heavy sites
- **PostgreSQL**: Usually doesn't need adjustment unless storing large amounts of historical data
- **Tor/Privoxy**: Rarely needs adjustment - these are lightweight services
- **Nginx**: Very lightweight - rarely needs more resources
- **Next.js**: Increase if the web interface feels slow or unresponsive

After modifying resource limits, restart the stack:

```bash
docker compose down
docker compose up -d
```

You can monitor resource usage with:

```bash
docker stats
```

## Monitoring .Onion Sites

This setup has been specially optimized for accessing Tor .onion sites:

### Best Practices for .Onion Sites

When adding .onion sites to ChangeDetection.io:

1. Use the Browser/JavaScript fetch method
2. Set longer timeouts (120+ seconds)
3. Reduce check frequency (once per 6-12 hours)
4. Always enable "Ignore SSL Errors"
5. Try manually visiting the site first with the `visit-onion-site.sh` script
6. For persistent issues, check the [TOR-TROUBLESHOOTING.md](TOR-TROUBLESHOOTING.md) guide

## Tor HTTP Proxy

This stack is using [avpnusr/torprivoxy](https://github.com/avpnusr/torprivoxy) as HTTP proxy to tunnel your requests through the Tor network. Make sure you have selected "Tor Network" within the "Request" tab of the given watch. By default it's enabled for all watches.

You can disable using tor for single watches by choosing "Direct" within the "Request" tab of the given watch.

Make sure the `proxies.json` is present in the toplevel of your datastore directory if you run into problems. The content of `proxies.json` is based on the changedetection.io documentation.

## Security Hardening

This stack has been hardened with several security best practices:

- Services bind to localhost by default (configurable in `.env`)
- Non-root users are used where possible for all services
- Container privileges are restricted
- Database uses secure authentication methods
- Volumes use explicit permissions
- Sensitive information is stored in environment variables
- See [SECURITY.md](SECURITY.md) for more details on implementation

## Permission Troubleshooting

If you encounter permission-related issues when running with non-root users:

- See [PERMISSION-TROUBLESHOOTING.md](PERMISSION-TROUBLESHOOTING.md) for solutions to common problems
- Each service is configured to use appropriate user permissions by default

## Logging Configuration

All services use Docker's JSON logging driver with:

- Log rotation (max 3 files of 10MB each)
- Log compression to save disk space
- Configurable via standard Docker logging options

## Email Configuration

See [SMTP-SETUP.md](SMTP-SETUP.md) for detailed instructions on setting up email notifications.

## Troubleshooting

If you encounter issues with Tor connectivity or .onion sites:

1. Check the [TOR-TROUBLESHOOTING.md](TOR-TROUBLESHOOTING.md) guide
2. Use the utility scripts above to diagnose problems
3. Examine container logs with `docker-compose logs <service-name>`

## Tips for Reliable .Onion Monitoring

- Avoid monitoring .onion sites too frequently (they're often slower and less reliable)
- Try different fetch methods if one doesn't work
- Some .onion sites may implement CAPTCHAs or other anti-bot measures
- If a site suddenly goes offline, try at different times of day (onion sites can be inconsistent)
- Use CSS selectors to focus on just the important content

## Email Notifications

To configure email notifications:

1. Run the setup script:

   ```bash
   ./setup-smtp.sh
   ```

2. Follow the prompts to configure your SMTP settings with your email provider.

3. After configuration, restart the application to apply changes:

   ```bash
   docker compose restart main-app
   ```

For detailed instructions and troubleshooting tips, see [SMTP-SETUP.md](SMTP-SETUP.md).

## Example

An example watch is provided within [`url-watches.json`](datastore/url-watches.json). It will check the Tor api and returns your exit IP and if the connection was established via the Tor nework.

## Credits

I do not own any of the projects. Credits go to the maintainers of each project.
