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
| nginx | User ID: 101 | Uses the nginx non-root user with pre-configured cache directories |

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

### Nginx as Non-Root User

Running Nginx as a non-root user requires special configuration:

1. **Custom Dockerfile**: Uses a custom Dockerfile that pre-creates cache directories with proper permissions
2. **Non-root user**: Runs as user 101:101 (nginx) which is specified in the Dockerfile
3. **Read-only mounts**: Configuration and certificate directories are mounted as read-only
4. **Named volume**: Uses a named volume (`nginx-cache`) to persist the cache directories

This custom image ensures Nginx can operate properly without requiring root privileges, maintaining security while enabling full functionality.

## Additional Security Practices

- Network segmentation using Docker networks
- Restricting port exposure to localhost where possible
- Using secrets management for sensitive information
- Regular updates of container images
