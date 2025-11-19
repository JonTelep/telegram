import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration interface defining all required environment variables
 */
export interface Config {
  server: {
    port: number;
    env: string;
  };
  telegram: {
    botToken: string;
    webhookSecret: string;
    webhookUrl: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
}

/**
 * Validates that a required environment variable exists
 * @param key - The environment variable key
 * @param value - The environment variable value
 * @throws Error if the value is missing
 */
function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Loads and validates all configuration from environment variables
 * @returns Validated configuration object
 */
export function loadConfig(): Config {
  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      env: process.env.NODE_ENV || 'development',
    },
    telegram: {
      botToken: requireEnv('TELEGRAM_BOT_TOKEN', process.env.TELEGRAM_BOT_TOKEN),
      webhookSecret: requireEnv('TELEGRAM_WEBHOOK_SECRET', process.env.TELEGRAM_WEBHOOK_SECRET),
      webhookUrl: requireEnv('TELEGRAM_WEBHOOK_URL', process.env.TELEGRAM_WEBHOOK_URL),
    },
    supabase: {
      url: requireEnv('SUPABASE_URL', process.env.SUPABASE_URL),
      serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  };
}

// Export singleton config instance
export const config = loadConfig();
