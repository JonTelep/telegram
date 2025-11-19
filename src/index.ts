import Fastify from 'fastify';
import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { telegramService } from './services/telegramService';
import { handleAddProduct } from './handlers/productHandler';
import { handleUpdateOrder } from './handlers/orderHandler';

/**
 * Creates and configures the Fastify server
 */
async function createServer() {
  const fastify = Fastify({
    logger: {
      level: config.server.env === 'development' ? 'debug' : 'info',
      transport: config.server.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Telegram webhook endpoint
  fastify.post('/api/webhook', async (request, reply) => {
    try {
      // Validate the secret token to ensure the request is from Telegram
      const secretToken = request.headers['x-telegram-bot-api-secret-token'];

      if (secretToken !== config.telegram.webhookSecret) {
        fastify.log.warn('⚠️  Webhook request with invalid secret token');
        return reply.code(403).send({ error: 'Forbidden: Invalid secret token' });
      }

      // Parse the update from the request body
      const update = request.body as TelegramBot.Update;

      if (!update) {
        return reply.code(400).send({ error: 'Bad Request: No update provided' });
      }

      fastify.log.debug({ update }, 'Received webhook update');

      // Process the update through the Telegram service
      telegramService.processUpdate(update);

      // Respond to Telegram quickly (they expect a 200 OK within a few seconds)
      return reply.code(200).send({ ok: true });

    } catch (error) {
      fastify.log.error({ error }, '❌ Error processing webhook');
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  return fastify;
}

/**
 * Registers all Telegram bot message handlers
 */
function registerBotHandlers() {
  // Handler for photo messages with /add_product command
  telegramService.onPhoto(async (msg) => {
    if (msg.caption && msg.caption.toLowerCase().startsWith('/add_product')) {
      await handleAddProduct(msg);
    }
  });

  // Handler for /update_order command
  telegramService.onText(/^\/update_order/, handleUpdateOrder);

  // Handler for /start command (welcome message)
  telegramService.onText(/^\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `👋 Welcome to the Telegram-Supabase Bridge Bot!\n\n` +
      `📦 Available Commands:\n\n` +
      `📸 /add_product - Add a new product\n` +
      `   Send a photo with caption:\n` +
      `   /add_product\n` +
      `   Name: Product Name\n` +
      `   Price: 99.99\n` +
      `   Description: Product description\n\n` +
      `📮 /update_order - Update order status\n` +
      `   Format: /update_order <order_number> <status> [tracking=<tracking_number>]\n` +
      `   Example: /update_order 123 shipped tracking=1Z999999\n\n` +
      `ℹ️ /help - Show this help message`;

    await telegramService.sendMessage(chatId, welcomeMessage);
  });

  // Handler for /help command
  telegramService.onText(/^\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `📚 Help - Telegram-Supabase Bridge\n\n` +
      `This bot allows you to manage products and orders through Telegram.\n\n` +
      `📸 Add Product:\n` +
      `1. Send a photo of the product\n` +
      `2. Add a caption starting with /add_product\n` +
      `3. Include Name, Price, and Description fields\n\n` +
      `📮 Update Order:\n` +
      `1. Use the command: /update_order <order_number> <status>\n` +
      `2. Optionally add tracking: tracking=<tracking_number>\n` +
      `3. The customer will be notified via email\n\n` +
      `❓ Need more help? Contact support.`;

    await telegramService.sendMessage(chatId, helpMessage);
  });

  console.log('✅ Bot message handlers registered');
}

/**
 * Main application startup function
 */
async function main() {
  try {
    console.log('🚀 Starting Telegram-Supabase Bridge Microservice...');
    console.log(`📍 Environment: ${config.server.env}`);
    console.log(`🔌 Port: ${config.server.port}`);

    // Create and configure the Fastify server
    const fastify = await createServer();

    // Register bot message handlers
    registerBotHandlers();

    // Set up the Telegram webhook
    await telegramService.setupWebhook();

    // Start the server
    await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0', // Listen on all network interfaces (required for Docker)
    });

    console.log('✅ Server is running and ready to receive webhooks');
    console.log(`🌐 Webhook URL: ${config.telegram.webhookUrl}`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT signal received: closing server');
  process.exit(0);
});

// Start the application
main();
