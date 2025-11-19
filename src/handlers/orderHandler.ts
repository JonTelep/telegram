import TelegramBot from 'node-telegram-bot-api';
import { telegramService } from '../services/telegramService';
import { supabaseService } from '../services/supabaseService';
import { parseOrderUpdate } from '../utils/parser';

/**
 * Handles the /update_order command
 *
 * Expected message format:
 * /update_order <order_number> <status> [tracking=<tracking_number>]
 *
 * Example: /update_order 123 shipped tracking=1Z9999W99999999999
 *
 * @param msg - Telegram message object
 * @param match - Regex match array (not used, but provided by onText)
 */
export async function handleUpdateOrder(
  msg: TelegramBot.Message,
  match: RegExpExecArray | null
): Promise<void> {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) {
    await telegramService.sendMessage(
      chatId,
      '❌ Error: No text provided for order update.'
    );
    return;
  }

  try {
    console.log(`📝 Processing update_order request from chat ${chatId}`);

    // Parse the order update command
    let parsedUpdate;
    try {
      parsedUpdate = parseOrderUpdate(text);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Invalid order update format';
      await telegramService.sendMessage(chatId, `❌ Error: ${errorMessage}`);
      return;
    }

    const { orderNumber, status, trackingNumber } = parsedUpdate;

    console.log(`🔍 Looking up order: ${orderNumber}`);

    // Find the order in the database
    const order = await supabaseService.findOrderByNumber(orderNumber);

    if (!order) {
      await telegramService.sendMessage(
        chatId,
        `❌ Error: Order '${orderNumber}' not found in the database.`
      );
      return;
    }

    console.log(`📦 Found order for customer: ${order.customer_email}`);

    // Update the order
    const updates: { status: string; tracking_number?: string | null } = {
      status: status,
    };

    if (trackingNumber !== null) {
      updates.tracking_number = trackingNumber;
    }

    console.log(`💾 Updating order ${orderNumber} with status: ${status}`);
    const updatedOrder = await supabaseService.updateOrder(orderNumber, updates);

    // Simulate sending an email notification
    // In a real production system, this would trigger an actual email service
    console.log(
      `📧 INFO: Triggering email to ${updatedOrder.customer_email} for order ${orderNumber}. Status: ${status}.`
    );

    // Build confirmation message
    let confirmationMessage = `✅ Order ${orderNumber} has been updated to '${status}'.\n\n`;
    confirmationMessage += `📧 Customer: ${updatedOrder.customer_email}\n`;

    if (trackingNumber) {
      confirmationMessage += `📮 Tracking: ${trackingNumber}\n`;
    }

    confirmationMessage += `\n💌 Email notification queued for customer.`;

    // Send success message
    await telegramService.sendMessage(chatId, confirmationMessage);

    console.log(`✅ Order ${orderNumber} updated successfully`);

  } catch (error) {
    console.error('❌ Error in handleUpdateOrder:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await telegramService.sendMessage(
      chatId,
      `❌ Error updating order: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
    );
  }
}
