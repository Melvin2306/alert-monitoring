# Security Practices in changedetectionio-tor

This document outlines the security practices implemented in this project.

## Container Security

### Non-Root Users

For improved security, all containers in this project run with non-root users where possible:

| Service | User Implementation | Notes |
|---------|-------------------|-------|
| proxy (torprivoxy) | User ID: 10000 | The torprivoxy image already implements a non-root user internally, but we explicitly set it for clarity |
| changedetection | User ID: 1000 | Running as a non-root user with restricted permissions |
| playwright-chrome | User ID: 1000 | Running as a non-root user for improved security when rendering pages |
| main-app (Next.js) | User `nextjs` (UID: 1001) | Configured in the Dockerfile, runs as a dedicated non-root user |
| postgres | User `postgres` | The PostgreSQL image already runs as a non-privileged postgres user internally |
| nginx | Default nginx user | Uses the standard nginx:alpine image with standard nginx user privileges |

### Security Benefits

Running containers as non-root users provides several security benefits:

1. **Reduced attack surface**: Limits the potential damage if a container is compromised
2. **Principle of least privilege**: Containers only have the permissions they need to function
3. **Container isolation**: Further enhances the isolation between containers and the host system
4. **Protection against CVEs**: Many container vulnerabilities require root access to exploit

### Volume Permissions

When using non-root users with volumes, ensure the proper permissions are set:

```bash
# Example: Set ownership for the datastore directory
sudo chown -R 1000:1000 ./datastore
```

### Nginx Configuration

Nginx runs using the standard nginx:alpine image:

1. **Standard Image**: Uses the official nginx:alpine image without custom modifications
2. **Standard User**: Runs with the default nginx user configured in the image
3. **Read-only mounts**: Configuration and certificate directories are mounted as read-only
4. **Security Headers**: Comprehensive security headers are configured in the nginx configuration

The nginx service is configured with strong SSL settings and security headers to protect against common web vulnerabilities.

## Additional Security Practices

- **Network segmentation**: Using isolated Docker networks with internal-only communication
- **Port restriction**: All sensitive ports are bound to localhost (127.0.0.1) only
- **Environment-based secrets**: Sensitive information stored in environment variables
- **Regular updates**: Container images should be updated regularly for security patches
- **Resource limits**: Individual CPU and memory limits configured for all services to prevent resource exhaustion (see Resource Management section below)
- **Health checks**: Comprehensive health monitoring for all services
- **SSL/TLS encryption**: All external communication is encrypted with configurable SSL certificates
- **Temporary filesystems**: Browser service uses tmpfs for enhanced security
- **Database isolation**: PostgreSQL is completely isolated from external networks
- **Proxy isolation**: Tor proxy provides an additional layer of anonymity and security

## Resource Management

### Container Resource Limits

All services are configured with individual CPU and memory limits to prevent resource exhaustion and ensure stable operation:

| Service | Memory Limit | CPU Limit | Security Benefit |
|---------|-------------|-----------|------------------|
| ChangeDetection | 512M | 0.5 | Prevents runaway processes from consuming system resources |
| PostgreSQL | 256M | 0.2 | Limits database resource usage to prevent DoS scenarios |
| Tor/Privoxy | 256M | 0.2 | Restricts proxy service resources for stability |
| Browser (Playwright) | 768M | 0.8 | Controls browser memory usage to prevent system overload |
| Nginx | 128M | 0.1 | Minimal resources for lightweight reverse proxy |
| Next.js App | 256M | 0.3 | Reasonable limits for Node.js application |

### Resource Limit Benefits

1. **DoS Protection**: Prevents individual containers from consuming all available system resources
2. **System Stability**: Ensures other system processes continue to function normally
3. **Predictable Performance**: Provides consistent resource allocation across services
4. **Security Isolation**: Limits the impact of potential security vulnerabilities
5. **Memory Management**: Prevents memory leaks from affecting the entire system

### Customizing Resource Limits

Resource limits can be adjusted in the `.env` file based on your security requirements and system capacity:

```bash
# Conservative limits for high-security environments
MEMORY_LIMIT_CHANGEDETECTION=256M
CPU_LIMIT_CHANGEDETECTION=0.3

# Generous limits for performance-critical deployments
MEMORY_LIMIT_CHANGEDETECTION=1G
CPU_LIMIT_CHANGEDETECTION=1.0
```

**Security considerations when adjusting limits:**

- **Lower limits**: Provide better isolation but may impact functionality
- **Higher limits**: Improve performance but reduce protection against resource exhaustion
- **Monitor usage**: Use `docker stats` to verify actual resource consumption
- **Test thoroughly**: Ensure services remain stable under expected workloads
