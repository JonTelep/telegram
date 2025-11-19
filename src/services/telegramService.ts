import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import https from 'https';
import http from 'http';

/**
 * Telegram service class providing bot operations and file downloads
 */
export class TelegramService {
  private bot: TelegramBot;

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
   * @param pattern - Regex pattern or string to match
   * @param callback - Handler function
   */
  onText(pattern: RegExp | string, callback: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void): void {
    this.bot.onText(pattern, callback);
  }

  /**
   * Registers a handler for photo messages
   * @param callback - Handler function
   */
  onPhoto(callback: (msg: TelegramBot.Message) => void): void {
    this.bot.on('photo', callback);
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

  /**
   * Gets the download link for a file
   * @param fileId - The Telegram file ID
   * @returns The file download URL
   */
  async getFileLink(fileId: string): Promise<string> {
    return this.bot.getFileLink(fileId);
  }

  /**
   * Downloads a file from Telegram servers
   * @param fileUrl - The file URL from getFileLink
   * @returns Buffer containing the file data
   */
  async downloadFile(fileUrl: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = fileUrl.startsWith('https') ? https : http;

      protocol.get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.on('error', (error) => {
          reject(error);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Gets the highest resolution photo from a photo array
   * @param photos - Array of PhotoSize objects
   * @returns The largest photo
   */
  getHighestResolutionPhoto(photos: TelegramBot.PhotoSize[]): TelegramBot.PhotoSize {
    return photos.reduce((prev, current) => {
      return (prev.file_size || 0) > (current.file_size || 0) ? prev : current;
    });
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
