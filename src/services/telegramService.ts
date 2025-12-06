import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';

/**
 * Telegram service class providing bot operations
 */
export class TelegramService {
  public bot: TelegramBot;

  constructor() {
    // Initialize bot without polling (webhook mode)
    this.bot = new TelegramBot(config.telegram.botToken, {
      polling: false,
    });
  }

  /**
   * Sets up the webhook for receiving Telegram updates
   * This should be called once when the server starts
   */
  async setupWebhook(): Promise<void> {
    try {
      await this.bot.setWebHook(config.telegram.webhookUrl, {
        secret_token: config.telegram.webhookSecret,
      });
      console.log(`✅ Webhook set successfully: ${config.telegram.webhookUrl}`);
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
      throw error;
    }
  }

  /**
   * Processes an incoming update from Telegram
   * This is called by the webhook endpoint
   * @param update - The update object from Telegram
   */
  processUpdate(update: TelegramBot.Update): void {
    this.bot.processUpdate(update);
  }

  /**
   * Registers a handler for text messages
   * @param pattern - Regex pattern to match
   * @param callback - Handler function
   */
  onText(pattern: RegExp, callback: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void): void {
    this.bot.onText(pattern, callback);
  }

  /**
   * Sends a text message to a chat
   * @param chatId - The chat ID to send to
   * @param text - The message text
   * @param options - Additional send options
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    options?: TelegramBot.SendMessageOptions
  ): Promise<TelegramBot.Message> {
    return this.bot.sendMessage(chatId, text, options);
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
