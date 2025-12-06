.PHONY: help install build dev start clean container-build container-run container-stop container-logs container-restart podman-build podman-run podman-run-native podman-stop podman-logs podman-restart podman-shell podman-clean deploy setup test lint

# Default target
help:
	@echo "Available commands:"
	@echo "  make install          - Install dependencies"
	@echo "  make build           - Build TypeScript to JavaScript"
	@echo "  make dev             - Run in development mode with hot reload"
	@echo "  make start           - Run production build"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make lint            - Run ESLint"
	@echo ""
	@echo "Podman commands:"
	@echo "  make podman-build      - Build container image with Podman"
	@echo "  make podman-run        - Run with podman-compose (requires podman-compose)"
	@echo "  make podman-run-native - Run with native Podman commands (recommended)"
	@echo "  make podman-stop       - Stop Podman container"
	@echo "  make podman-logs       - View Podman container logs"
	@echo "  make podman-restart    - Restart Podman container"
	@echo "  make podman-shell      - Open shell in running container"
	@echo "  make podman-clean      - Stop and remove container and image"
	@echo ""
	@echo "Generic container commands (uses Podman):"
	@echo "  make container-build - Build container image"
	@echo "  make container-run   - Run container"
	@echo "  make container-stop  - Stop container"
	@echo "  make container-logs  - View container logs"

# Install dependencies
install:
	npm install

# Build TypeScript
build:
	npm run build

# Run in development mode
dev:
	npm run dev:watch

# Run production build
start: build
	npm start

# Clean build artifacts
clean:
	npm run clean

# Run linter
lint:
	npm run lint

# Podman commands
podman-build:
	podman build -t telegram-listener .

# Run using podman-compose (requires: pip install podman-compose)
podman-run:
	podman-compose up -d

# Run using native Podman commands (no compose needed)
podman-run-native:
	@echo "🚀 Starting container with Podman..."
	podman run -d \
		--name telegram-listener \
		-p 3000:3000 \
		--env-file .env \
		--restart unless-stopped \
		--health-cmd='node -e "require(\"http\").get(\"http://localhost:3000/health\", (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"' \
		--health-interval=30s \
		--health-timeout=10s \
		--health-retries=3 \
		--health-start-period=10s \
		telegram-listener
	@echo "✅ Container started"
	@echo "Check status with: podman ps"
	@echo "View logs with: make podman-logs"

podman-stop:
	@if command -v podman-compose >/dev/null 2>&1; then \
		podman-compose down; \
	else \
		podman stop telegram-listener 2>/dev/null || true; \
		podman rm telegram-listener 2>/dev/null || true; \
	fi

podman-logs:
	@if podman ps -a --format "{{.Names}}" | grep -q "telegram-listener"; then \
		podman logs -f telegram-listener; \
	else \
		podman-compose logs -f telegram-listener 2>/dev/null || echo "Container not running"; \
	fi

podman-restart:
	@if podman ps -a --format "{{.Names}}" | grep -q "telegram-listener"; then \
		podman restart telegram-listener; \
	else \
		podman-compose restart 2>/dev/null || echo "Container not found"; \
	fi

podman-shell:
	podman exec -it telegram-listener sh

podman-clean:
	podman stop telegram-listener 2>/dev/null || true
	podman rm telegram-listener 2>/dev/null || true
	podman rmi telegram-listener 2>/dev/null || true

# Generic container commands (alias to Podman)
container-build: podman-build
container-run: podman-run-native
container-stop: podman-stop
container-logs: podman-logs
container-restart: podman-restart

# Full development setup
setup: install
	@echo "✅ Dependencies installed"
	@echo "📝 Please configure your .env file with:"
	@echo "   - TELEGRAM_BOT_TOKEN"
	@echo "   - TELEGRAM_WEBHOOK_SECRET"
	@echo "   - TELEGRAM_WEBHOOK_URL"
	@echo "   - SUPABASE_URL"
	@echo "   - SUPABASE_SERVICE_ROLE_KEY"
	@echo ""
	@echo "Run 'make dev' to start the development server"

# Production deployment
deploy: podman-build podman-run-native
	@echo "✅ Service deployed and running"
	@echo "Check status with: podman ps"
	@echo "Check logs with: make podman-logs"
	@echo "Stop service with: make podman-stop"
