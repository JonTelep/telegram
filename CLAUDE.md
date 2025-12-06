# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready, foundational Telegram webhook listener microservice built with TypeScript and Fastify. It receives messages via Telegram webhooks (not polling) and logs them to console with structured formatting. The service is designed to be a minimal foundation that can be extended with custom bot functionality.

## Development Commands

### Node.js Development
```bash
npm install          # Install dependencies
npm run dev          # Development mode with ts-node (no hot reload)
npm run dev:watch    # Development mode with hot reload (ts-node-dev)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build (requires npm run build first)
npm run lint         # Run ESLint
npm run clean        # Remove dist/ folder
```

### Container Development (Podman)
```bash
make podman-build       # Build container image
make podman-run-native  # Run container (recommended native Podman)
make podman-run         # Run with podman-compose (requires podman-compose)
make podman-logs        # View container logs (follows)
make podman-stop        # Stop and remove container
make podman-shell       # Open shell in running container
make podman-clean       # Remove container and image
make deploy             # Build and deploy in one command
```

Use `make help` to see all available commands.

## Architecture

### Request Flow
1. **Telegram** sends webhook POST to `/api/webhook` with secret token header
2. **Fastify** validates secret token, returns 200 OK immediately
3. **Webhook handler** processes update asynchronously via `telegramService.processUpdate()`
4. **Registered handlers** process specific message types and log to console
5. Messages are logged with structured formatting showing chat ID, user, message content, and timestamp

### Key Architectural Patterns

**Singleton Service**: `telegramService` is exported as a singleton instance created at module load time. Always import the instance, never instantiate the class directly.

```typescript
// Correct
import { telegramService } from './services/telegramService';

// Wrong - don't do this
import { TelegramService } from './services/telegramService';
const service = new TelegramService();
```

**Webhook vs Polling**: The bot operates in webhook mode (`polling: false`). The Telegram Bot API library still uses event handlers (`onText`, `on('text')`, `on('photo')`), but updates are pushed via `processUpdate()` rather than polling.

**Handler Registration**: Message handlers are registered in `src/index.ts` using:
- `telegramService.bot.on('text', handleTextMessage)` - All text messages
- `telegramService.bot.on('photo', handlePhotoMessage)` - All photo messages
- `telegramService.onText(/^\/start/, handler)` - Specific commands

**Direct Bot Access**: The `bot` property on `telegramService` is public to allow direct access to the underlying Telegram Bot API instance for registering event handlers.

**Configuration**: All environment variables are loaded and validated at startup via `src/config/index.ts`. The `requireEnv()` function throws if required vars are missing, causing startup to fail fast. Configuration is exported as a singleton `config` object.

**Error Handling**: Handlers catch errors and log them to console. The webhook endpoint always returns 200 OK to Telegram to prevent retry loops.

## File Structure

```
src/
├── config/
│   └── index.ts              # Environment variable validation and config singleton
├── handlers/
│   └── messageHandler.ts     # Message logging handlers (text, photo)
├── services/
│   └── telegramService.ts    # Telegram Bot API wrapper (webhook mode)
└── index.ts                  # Fastify server, webhook endpoint, handler registration
```

## Important Implementation Details

### Message Logging

All messages are logged to console with structured formatting:

- **Text messages**: Shows chat ID, username, message text, timestamp
- **Photo messages**: Shows chat ID, username, caption, photo count, timestamp
- **Commands**: Logged via the text message handler

Handlers are in `src/handlers/messageHandler.ts`:
- `handleTextMessage()` - Logs all text messages
- `handlePhotoMessage()` - Logs all photo messages

### Webhook Security

- Telegram includes `X-Telegram-Bot-Api-Secret-Token` header
- Fastify endpoint validates this against `TELEGRAM_WEBHOOK_SECRET` from config
- Invalid tokens receive 403 Forbidden
- Webhook must be HTTPS in production (Telegram requirement)

### Handler Registration Order

Handlers are registered in this order:
1. Global text handler (logs all text)
2. Global photo handler (logs all photos)
3. `/start` command handler
4. `/help` command handler

The global handlers fire for ALL messages of that type, including commands. This is intentional for logging purposes.

## Environment Variables

Required in `.env`:
```
PORT=3000
NODE_ENV=production
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_WEBHOOK_SECRET=<strong random secret>
TELEGRAM_WEBHOOK_URL=<public HTTPS URL>/api/webhook
```

Generate webhook secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Local Development Setup

1. Use ngrok to expose local server: `ngrok http 3000`
2. Set `TELEGRAM_WEBHOOK_URL` to ngrok URL + `/api/webhook`
3. Run `npm run dev:watch` (hot reload) or `npm run dev`
4. Webhook is set automatically on startup via `telegramService.setupWebhook()`

## Testing

Send messages to the bot on Telegram:

**Text message**:
```
Hello bot!
```

**Photo with caption**:
Send any photo with or without a caption

**Commands**:
```
/start
/help
```

Check console output for structured logs showing message details.

## Common Gotchas

- **Handler registration order**: Handlers are registered in `src/index.ts` after server creation but before server start
- **Global handlers**: The `on('text')` and `on('photo')` handlers fire for ALL messages, not just non-command messages
- **Quick webhook response**: Webhook endpoint returns 200 OK immediately before processing completes (Telegram requires response within seconds)
- **No test suite**: There are no automated tests - test manually via Telegram
- **Logging**: Uses console.log for message logging, Fastify uses Pino for request logging
- **Bot property access**: The `bot` property on `telegramService` is public for direct access to register additional handlers

## Extending This Bot

This is a minimal foundation designed to be extended. Common extensions:

### Adding New Command Handlers

In `src/index.ts`, in `registerBotHandlers()`:

```typescript
telegramService.onText(/^\/custom/, async (msg) => {
  console.log('Custom command received:', msg.text);
  await telegramService.sendMessage(msg.chat.id, 'Response message');
});
```

### Adding New Event Handlers

For other message types (document, audio, video, etc.):

```typescript
telegramService.bot.on('document', async (msg) => {
  console.log('Document received:', msg.document?.file_name);
});
```

### Adding External Services

1. Create a new service class in `src/services/`
2. Export as a singleton instance (like `telegramService`)
3. Add required environment variables to `src/config/index.ts`
4. Use the service in your handlers

### Adding Database Integration

1. Install database client (e.g., PostgreSQL, MongoDB)
2. Create database service in `src/services/`
3. Add connection config to `src/config/index.ts`
4. Call database service from message handlers

## Making Changes

When adding new handlers:
1. Create handler function in `src/handlers/messageHandler.ts` or a new handler file
2. Register handler in `src/index.ts` in `registerBotHandlers()`
3. Update help text in `/start` and `/help` handlers if needed

When adding dependencies:
1. Add to package.json via `npm install <pkg>`
2. Rebuild container image with `make podman-build` for deployment

When adding environment variables:
1. Update `Config` interface in `src/config/index.ts`
2. Add to `loadConfig()` function with `requireEnv()` if required
3. Update `.env.example` with the new variable
