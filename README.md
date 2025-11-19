# Telegram-Supabase Bridge Microservice

A production-ready microservice that acts as a bridge between a Telegram bot and a Supabase backend. This service enables automated product management and order updates through Telegram messages.

## Features

- **Webhook-based Telegram Integration**: Efficient webhook mode (not polling) for real-time message processing
- **Product Management**: Add products with images directly from Telegram
- **Order Updates**: Update order status and tracking information via Telegram commands
- **Image Upload**: Automatic image upload to Supabase Storage
- **Secure Webhook**: Token-based webhook authentication
- **Production-Ready**: Built with TypeScript, Fastify, and includes Docker support
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance HTTP server)
- **Telegram**: node-telegram-bot-api
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Configuration**: dotenv
- **Containerization**: Docker (multi-stage build)

## Project Structure

```
telegram-listener/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration loader
│   ├── handlers/
│   │   ├── productHandler.ts     # Product creation logic
│   │   └── orderHandler.ts       # Order update logic
│   ├── services/
│   │   ├── telegramService.ts    # Telegram bot client
│   │   └── supabaseService.ts    # Supabase client
│   ├── utils/
│   │   └── parser.ts             # Message parsing utilities
│   └── index.ts                  # Main server entry point
├── database/
│   └── schema.sql                # Supabase database schema
├── Dockerfile                    # Multi-stage Docker build
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather) and get your bot token
3. **Supabase Project**:
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and service role key
4. **Public URL**: For webhook (use ngrok for local development or deploy to a cloud service)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd telegram-listener
npm install
```

### 2. Set Up Supabase Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# The schema is located at database/schema.sql
```

This will create:
- `products` table
- `orders` table
- `product_images` storage bucket
- Sample order data for testing

### 3. Configure Environment Variables

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
TELEGRAM_BOT_TOKEN=your_actual_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=generate_a_strong_random_secret_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhook

# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Security Note**: Generate a strong random secret for `TELEGRAM_WEBHOOK_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Build and Run

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
podman build -t telegram-supabase-bridge .
podman run -d \
  --name telegram-supabase-bridge \
  -p 3000:3000 \
  --env-file .env \
  telegram-supabase-bridge
```

**Using Docker:**

```bash
# Build the image
docker build -t telegram-supabase-bridge .

# Run the container
docker run -d \
  --name telegram-bot \
  -p 3000:3000 \
  --env-file .env \
  telegram-supabase-bridge
```

See [PODMAN.md](PODMAN.md) for detailed Podman usage, rootless containers, and systemd integration.

### 5. Set Up Webhook URL

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

### Add a Product

1. Send a photo to your bot
2. Add a caption in this format:

```
/add_product
Name: Vintage Denim Jacket
Price: 79.99
Description: A classic jacket, perfect for all seasons.
```

The bot will:
- Download the image
- Upload it to Supabase Storage
- Create a product record in the database
- Reply with confirmation and product details

### Update an Order

Send a text message in this format:

```
/update_order 123 shipped tracking=1Z9999W99999999999
```

Parameters:
- `123`: Order number
- `shipped`: New status
- `tracking=...`: Optional tracking number

The bot will:
- Find the order in the database
- Update the status and tracking number
- Log an email notification trigger
- Reply with confirmation

### Other Commands

- `/start` - Welcome message and command overview
- `/help` - Detailed help information

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

## Error Handling

The service includes comprehensive error handling:

- **Invalid message format**: User-friendly error messages
- **Missing required fields**: Specific guidance on correct format
- **Database errors**: Logged for debugging, generic message to user
- **Image upload failures**: Detailed error logging
- **Order not found**: Clear notification to user

## Security Features

1. **Webhook Secret Validation**: All webhook requests are validated using a secret token
2. **Non-root Docker User**: Container runs as a non-privileged user
3. **Environment Variable Validation**: Required variables are checked at startup
4. **Input Validation**: All user inputs are validated and sanitized
5. **Service Role Key**: Uses Supabase service role key for bypassing RLS

## Monitoring and Logging

The service uses Pino for structured logging:

- **Development**: Pretty-printed logs with timestamps
- **Production**: JSON-formatted logs for log aggregation

Example logs:

```
✅ Server is running and ready to receive webhooks
🌐 Webhook URL: https://your-domain.com/api/webhook
📝 Processing add_product request from chat 12345
📸 Downloading photo with file_id: AgACAgIAAxk...
✅ Product created with ID: 42
```

## Deployment

### Docker Compose Example

```yaml
version: '3.8'

services:
  telegram-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET}
      - TELEGRAM_WEBHOOK_URL=${TELEGRAM_WEBHOOK_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
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

## Development

### Scripts

**Node.js:**
- `npm run dev` - Run in development mode with hot reload
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

See `make help` for all available commands and [PODMAN.md](PODMAN.md) for detailed container usage.

### Testing

To test the bot locally:

1. Start the service with `npm run dev`
2. Use ngrok to expose your local server
3. Send test messages to your bot
4. Check the console logs for processing details

## Troubleshooting

### Webhook not receiving updates

1. Verify your webhook URL is publicly accessible
2. Check that the secret token matches in Telegram and your `.env`
3. Ensure your SSL certificate is valid (Telegram requires HTTPS)
4. Check Telegram webhook info:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### Image upload fails

1. Verify the `product_images` bucket exists in Supabase Storage
2. Check that the bucket is set to public
3. Ensure your service role key has the correct permissions
4. Check Supabase Storage policies

### Database errors

1. Verify the tables exist in Supabase
2. Check that RLS policies allow the service role key
3. Ensure the service role key is correct (not the anon key)

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
- Review [Supabase documentation](https://supabase.com/docs)

---

Built with ❤️ using TypeScript, Fastify, and Supabase
