import Fastify from 'fastify';
import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { telegramService } from './services/telegramService';
import { handleTextMessage, handlePhotoMessage } from './handlers/messageHandler';

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
  fastify.get('/health', async () => {
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
  // Log all text messages
  telegramService.bot.on('text', handleTextMessage);

  // Log all photo messages
  telegramService.bot.on('photo', handlePhotoMessage);

  // Handle /start command
  telegramService.onText(/^\/start/, async (msg) => {
    await telegramService.sendMessage(
      msg.chat.id,
      'Hello! I am listening to your messages. Check the console logs.'
    );
  });

  // Handle /help command
  telegramService.onText(/^\/help/, async (msg) => {
    await telegramService.sendMessage(
      msg.chat.id,
      'Send me any message and I will log it to the console.'
    );
  });

  console.log('✅ Bot message handlers registered');
}

/**
 * Main application startup function
 */
async function main() {
  try {
    console.log('🚀 Starting Telegram Listener Microservice...');
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
