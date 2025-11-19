# Podman Usage Guide

This project fully supports Podman as a Docker alternative. Podman is a daemonless container engine that's more secure and doesn't require root privileges.

## Quick Start with Podman

### Option 1: Using Native Podman Commands (Recommended)

```bash
# Build the image
make podman-build

# Run the container
make podman-run-native

# View logs
make podman-logs

# Stop the container
make podman-stop
```

### Option 2: Using podman-compose

If you prefer to use docker-compose syntax:

```bash
# Install podman-compose
pip install podman-compose

# Run with compose
make podman-run
```

## Available Podman Commands

| Command | Description |
|---------|-------------|
| `make podman-build` | Build container image with Podman |
| `make podman-run-native` | Run using native Podman (no compose needed) |
| `make podman-run` | Run using podman-compose |
| `make podman-stop` | Stop and remove the container |
| `make podman-logs` | View container logs (follow mode) |
| `make podman-restart` | Restart the container |
| `make podman-shell` | Open a shell in the running container |
| `make podman-clean` | Stop, remove container and image |

## Generic Container Commands

For convenience, there are also generic commands that use Podman:

```bash
make container-build    # Same as podman-build
make container-run      # Same as podman-run-native
make container-stop     # Same as podman-stop
make container-logs     # Same as podman-logs
```

## Manual Podman Commands

If you prefer to use Podman directly without the Makefile:

### Build the Image

```bash
podman build -t telegram-supabase-bridge .
```

### Run the Container

```bash
podman run -d \
  --name telegram-supabase-bridge \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  telegram-supabase-bridge
```

### View Logs

```bash
podman logs -f telegram-supabase-bridge
```

### Stop and Remove

```bash
podman stop telegram-supabase-bridge
podman rm telegram-supabase-bridge
```

### Check Container Status

```bash
podman ps -a
```

### Inspect Container

```bash
podman inspect telegram-supabase-bridge
```

### Open Shell in Container

```bash
podman exec -it telegram-supabase-bridge sh
```

## Podman vs Docker Differences

### Key Advantages of Podman:

1. **Daemonless**: No background daemon required
2. **Rootless**: Can run without root privileges (more secure)
3. **Pod Support**: Native Kubernetes pod support
4. **Compatible**: Uses same command syntax as Docker
5. **Systemd Integration**: Better integration with systemd

### Using Rootless Podman

To run in rootless mode (recommended for security):

```bash
# No special setup needed, Podman defaults to rootless
podman run -d \
  --name telegram-supabase-bridge \
  -p 3000:3000 \
  --env-file .env \
  telegram-supabase-bridge
```

### Port Binding in Rootless Mode

If you get permission errors binding to port 3000, you can:

1. Use a higher port (>1024):
```bash
# In .env, set PORT=3001
podman run -d -p 3001:3001 --env-file .env telegram-supabase-bridge
```

2. Or enable low port binding:
```bash
# Allow rootless containers to bind to ports < 1024
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/99-podman.conf
sudo sysctl --system
```

## Systemd Integration

Create a systemd service for automatic startup:

### Generate Systemd Unit File

```bash
# Run the container first
make podman-run-native

# Generate systemd unit
podman generate systemd --name telegram-supabase-bridge --files --new

# Move to systemd directory (rootless)
mkdir -p ~/.config/systemd/user/
mv container-telegram-supabase-bridge.service ~/.config/systemd/user/

# Enable and start
systemctl --user enable container-telegram-supabase-bridge.service
systemctl --user start container-telegram-supabase-bridge.service

# Enable lingering (keeps service running when logged out)
loginctl enable-linger $USER
```

### Check Service Status

```bash
systemctl --user status container-telegram-supabase-bridge.service
```

### View Logs via Journalctl

```bash
journalctl --user -u container-telegram-supabase-bridge.service -f
```

## Podman Compose

If you prefer using docker-compose.yml syntax:

### Install podman-compose

```bash
# Using pip
pip install podman-compose

# Or using package manager (Fedora/RHEL)
sudo dnf install podman-compose

# Ubuntu/Debian
sudo apt install podman-compose
```

### Use with Existing docker-compose.yml

```bash
# Start services
podman-compose up -d

# View logs
podman-compose logs -f

# Stop services
podman-compose down
```

## Troubleshooting

### Permission Denied on Socket

If you get socket permission errors:

```bash
# Enable podman socket for current user
systemctl --user enable --now podman.socket
```

### SELinux Issues (Fedora/RHEL)

If you encounter SELinux denials:

```bash
# Check for denials
sudo ausearch -m avc -ts recent

# Relabel container storage
podman system migrate
```

### Storage Issues

If you run out of space:

```bash
# Clean up unused images
podman image prune -a

# Clean up unused containers
podman container prune

# Clean up everything
podman system prune -a
```

## Podman Pod Support

For advanced users, you can run the service in a Podman pod:

```bash
# Create a pod
podman pod create --name telegram-bot-pod -p 3000:3000

# Run container in the pod
podman run -d \
  --pod telegram-bot-pod \
  --name telegram-supabase-bridge \
  --env-file .env \
  telegram-supabase-bridge

# Manage the entire pod
podman pod stop telegram-bot-pod
podman pod start telegram-bot-pod
podman pod rm telegram-bot-pod
```

## Health Checks

The container includes health checks. View health status:

```bash
# Check health status
podman healthcheck run telegram-supabase-bridge

# View health history
podman inspect telegram-supabase-bridge --format='{{.State.Health}}'
```

## Resources and Limits

Set resource limits for the container:

```bash
podman run -d \
  --name telegram-supabase-bridge \
  -p 3000:3000 \
  --env-file .env \
  --memory=512m \
  --cpus=1 \
  telegram-supabase-bridge
```

## Best Practices

1. **Use Rootless Mode**: Run Podman without root for better security
2. **Enable Auto-Updates**: Use `podman auto-update` for automatic image updates
3. **Use Systemd**: Integrate with systemd for automatic restarts
4. **Resource Limits**: Always set memory and CPU limits
5. **Regular Cleanup**: Clean up unused images and containers regularly

## More Information

- [Podman Documentation](https://docs.podman.io/)
- [Podman vs Docker](https://docs.podman.io/en/latest/markdown/podman.1.html)
- [Rootless Containers](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)
- [Podman Compose](https://github.com/containers/podman-compose)

---

For general project documentation, see [README.md](README.md)
