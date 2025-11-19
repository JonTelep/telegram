# Quick Start Guide

Get your Telegram-Supabase Bridge up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Telegram bot token from [@BotFather](https://t.me/botfather)
- [ ] Supabase account and project created
- [ ] Public URL for webhook (ngrok for local development)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Tables

1. Go to your Supabase project dashboard
2. Click on "SQL Editor"
3. Copy and paste the contents of `database/schema.sql`
4. Click "Run" to execute the SQL

This creates:
- ✅ `products` table
- ✅ `orders` table
- ✅ `product_images` storage bucket
- ✅ Sample order data

### 3. Get Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 4. Generate a Webhook Secret

Run this command to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output.

### 5. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (under "Project API keys" → "service_role")

⚠️ **Important**: Use the `service_role` key, NOT the `anon` key!

### 6. Set Up Your Public URL

#### For Local Development (using ngrok):

```bash
# Install ngrok if you haven't
# Then run:
ngrok http 3000
```

Copy the HTTPS URL (looks like: `https://xxxx-xx-xx-xxx-xxx.ngrok.io`)

#### For Production:

Use your actual domain (e.g., `https://bot.yourdomain.com`)

### 7. Configure Environment Variables

The `.env` file has been created for you. Edit it with your actual values:

```bash
# Open .env in your editor
nano .env
# or
code .env
```

Fill in these values:

```env
PORT=3000
NODE_ENV=development

# Your bot token from BotFather
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# The secret you generated in step 4
TELEGRAM_WEBHOOK_SECRET=your_generated_secret_here

# Your public URL + /api/webhook
TELEGRAM_WEBHOOK_URL=https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/webhook

# Your Supabase project URL
SUPABASE_URL=https://xxxxx.supabase.co

# Your Supabase service role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 8. Start the Service

```bash
npm run dev
```

You should see:

```
🚀 Starting Telegram-Supabase Bridge Microservice...
✅ Webhook set successfully
✅ Server is running and ready to receive webhooks
```

### 9. Test Your Bot

1. Open Telegram and find your bot
2. Send `/start` to see the welcome message
3. Try adding a product:
   - Send a photo
   - Add this caption:
   ```
   /add_product
   Name: Test Product
   Price: 29.99
   Description: My first test product
   ```

4. Try updating an order (using sample data):
   ```
   /update_order 123 shipped tracking=ABC123
   ```

## Quick Commands

```bash
# Development
npm run dev              # Run with hot reload
npm run build            # Build for production
npm start                # Run production build

# Podman (Recommended)
make podman-build        # Build container image
make podman-run-native   # Run with Podman (no compose needed)
make podman-logs         # View logs
make podman-stop         # Stop container
make deploy              # Build and run in one command

# Docker (Alternative)
docker build -t telegram-supabase-bridge .
docker run -d --name telegram-bot -p 3000:3000 --env-file .env telegram-supabase-bridge

# Utilities
make lint                # Check code quality
make clean               # Remove build files
make help                # Show all available commands
```

> 💡 **Tip**: See [PODMAN.md](PODMAN.md) for advanced Podman features like rootless containers, systemd integration, and pods.

## Troubleshooting

### "Webhook failed"
- ✅ Make sure your public URL is HTTPS (not HTTP)
- ✅ Check that ngrok is running
- ✅ Verify the webhook URL in your `.env` is correct

### "Failed to upload image"
- ✅ Verify the `product_images` bucket exists in Supabase Storage
- ✅ Make sure the bucket is set to "Public"
- ✅ Check your service role key is correct

### "Order not found"
- ✅ Make sure you ran the database schema SQL
- ✅ Sample orders are: 123, 456, 789

## Next Steps

- [ ] Customize the bot commands
- [ ] Add more product fields
- [ ] Implement email notifications
- [ ] Deploy to production
- [ ] Set up monitoring and logging

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review Telegram Bot API: https://core.telegram.org/bots/api
- Review Supabase docs: https://supabase.com/docs

Happy coding! 🚀
