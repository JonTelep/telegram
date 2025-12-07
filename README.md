# Telegram Listener Microservice

A production-ready, foundational Telegram webhook listener microservice. This service receives messages via Telegram webhooks and logs them to console, providing a minimal foundation for building custom Telegram bot functionality.

## Features

- **Webhook-based Telegram Integration**: Efficient webhook mode (not polling) for real-time message processing
- **Message Logging**: All messages logged to console with structured formatting
- **Secure Webhook**: Token-based webhook authentication
- **Production-Ready**: Built with TypeScript, Fastify, and includes Docker/Podman support
- **Containerized**: Multi-stage Docker build for efficient deployment
- **Minimal Dependencies**: No external service dependencies (only Telegram API)

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance HTTP server)
- **Telegram**: node-telegram-bot-api
- **Configuration**: dotenv
- **Containerization**: Docker/Podman (multi-stage build)

## Project Structure

```
telegram-listener/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration loader
│   ├── handlers/
│   │   └── messageHandler.ts     # Message logging handlers
│   ├── services/
│   │   └── telegramService.ts    # Telegram bot client
│   └── index.ts                  # Main server entry point
├── Dockerfile                    # Multi-stage Docker build
├── Makefile                      # Build and deployment commands
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather) and get your bot token
3. **Public URL**: For webhook (use ngrok for local development or deploy to a cloud service)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd telegram-listener
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhook
```

**Security Note**: Generate a strong random secret for `TELEGRAM_WEBHOOK_SECRET`:

#### Openssl
```bash
openssl rand -hex 32
```

#### Node
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Ngrok
Using ngrok for webhook run the following
```bash
ngrok http 3000
```


### 3. Build and Run

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

#### Docker / Podman

**Using Podman (recommended):**

```bash
# Build and run with Podman
make podman-build
make podman-run-native

# Or manually
podman build -t telegram-listener .
podman run -d \
  --name telegram-listener \
  -p 3000:3000 \
  --env-file .env \
  telegram-listener
```

**Using Docker:**

```bash
# Build the image
docker build -t telegram-listener .

# Run the container
docker run -d \
  --name telegram-listener \
  -p 3000:3000 \
  --env-file .env \
  telegram-listener
```

### 4. Set Up Webhook URL

For local development, use [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Update your `.env` file with the ngrok URL:

```env
TELEGRAM_WEBHOOK_URL=https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/webhook
```

Then restart the service.

## Usage

### Send Messages to Your Bot

1. Find your bot on Telegram
2. Send any message (text, photo, etc.)
3. Check your console logs to see the structured message output

### Example Console Output

**Text Message:**
```
📝 Text Message Received:
  Chat ID: 123456789
  User: john_doe
  Message: Hello bot!
  Timestamp: 2025-01-15T10:30:00.000Z
```

**Photo Message:**
```
📷 Photo Message Received:
  Chat ID: 123456789
  User: john_doe
  Caption: Check this out!
  Photo Count: 4
  Timestamp: 2025-01-15T10:31:00.000Z
```

### Commands

- `/start` - Receive a welcome message
- `/help` - Get help information

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Webhook Endpoint

```http
POST /api/webhook
Headers:
  X-Telegram-Bot-Api-Secret-Token: your_webhook_secret
```

This endpoint is called by Telegram and should not be accessed directly.

## Security Features

1. **Webhook Secret Validation**: All webhook requests are validated using a secret token
2. **Non-root Docker User**: Container runs as a non-privileged user
3. **Environment Variable Validation**: Required variables are checked at startup
4. **Input Validation**: All user inputs are validated

## Monitoring and Logging

The service uses Pino for structured logging:

- **Development**: Pretty-printed logs with timestamps
- **Production**: JSON-formatted logs for log aggregation

Example logs:

```
✅ Server is running and ready to receive webhooks
🌐 Webhook URL: https://your-domain.com/api/webhook
📝 Text Message Received:
  Chat ID: 123456789
  User: john_doe
  Message: Hello!
  Timestamp: 2025-01-15T10:30:00.000Z
```

## Development

### Scripts

**Node.js:**
- `npm run dev` - Run in development mode with ts-node
- `npm run dev:watch` - Run in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build
- `npm run clean` - Remove build artifacts
- `npm run lint` - Run ESLint code quality checks

**Podman (Container):**
- `make podman-build` - Build container image with Podman
- `make podman-run-native` - Run with native Podman (recommended)
- `make podman-logs` - View container logs
- `make podman-stop` - Stop and remove container
- `make podman-shell` - Open shell in running container
- `make deploy` - Build and deploy in one command

See `make help` for all available commands.

### Testing

To test the bot locally:

1. Start the service with `npm run dev`
2. Use ngrok to expose your local server
3. Send test messages to your bot
4. Check the console logs for message output

## Extending the Bot

This is a foundational listener designed to be extended. To add custom functionality:

1. **Add new handlers** in `src/handlers/` directory
2. **Register handlers** in `src/index.ts` in the `registerBotHandlers()` function
3. **Add services** in `src/services/` if you need to integrate with external APIs

Example: Adding a custom command handler:

```typescript
// In src/index.ts, in registerBotHandlers():
telegramService.onText(/^\/custom/, async (msg) => {
  console.log('Custom command received:', msg.text);
  await telegramService.sendMessage(msg.chat.id, 'Custom command processed!');
});
```

## Troubleshooting

### Webhook not receiving updates

1. Verify your webhook URL is publicly accessible
2. Check that the secret token matches in Telegram and your `.env`
3. Ensure your SSL certificate is valid (Telegram requires HTTPS)
4. Check Telegram webhook info:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### Messages not appearing in console

1. Check that the service is running (`make podman-logs` for containers)
2. Verify handlers are registered correctly in `src/index.ts`
3. Check for errors in the console output

## Deployment

### Docker Compose Example

```yaml
version: '3.8'

services:
  telegram-listener:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET}
      - TELEGRAM_WEBHOOK_URL=${TELEGRAM_WEBHOOK_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

### Cloud Deployment Options

- **Railway**: One-click deploy with GitHub integration
- **Render**: Free tier available for small projects
- **DigitalOcean App Platform**: Managed container hosting
- **AWS ECS/Fargate**: Enterprise-grade container orchestration
- **Google Cloud Run**: Serverless container platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this in your own projects!

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Telegram Bot API documentation](https://core.telegram.org/bots/api)

---

Built with TypeScript and Fastify
