import TelegramBot from 'node-telegram-bot-api';
import { telegramService } from '../services/telegramService';
import { supabaseService } from '../services/supabaseService';
import { parseProductCaption, mimeToExtension } from '../utils/parser';

/**
 * Handles the /add_product command with photo attachment
 *
 * Expected message format:
 * - Photo attachment
 * - Caption: /add_product
 *           Name: Product Name
 *           Price: 99.99
 *           Description: Product description
 *
 * @param msg - Telegram message object
 */
export async function handleAddProduct(msg: TelegramBot.Message): Promise<void> {
  const chatId = msg.chat.id;

  try {
    // Validate that the message has a photo
    if (!msg.photo || msg.photo.length === 0) {
      await telegramService.sendMessage(
        chatId,
        '❌ Error: Please send a photo with the /add_product command.'
      );
      return;
    }

    // Validate that the message has a caption
    if (!msg.caption) {
      await telegramService.sendMessage(
        chatId,
        '❌ Error: Please include a caption with product details.\n\nFormat:\n/add_product\nName: Product Name\nPrice: 99.99\nDescription: Product description'
      );
      return;
    }

    // Check if caption starts with /add_product
    if (!msg.caption.toLowerCase().startsWith('/add_product')) {
      await telegramService.sendMessage(
        chatId,
        '❌ Error: Caption must start with /add_product'
      );
      return;
    }

    console.log(`📝 Processing add_product request from chat ${chatId}`);

    // Parse the product data from caption
    let parsedProduct;
    try {
      parsedProduct = parseProductCaption(msg.caption);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Invalid product format';
      await telegramService.sendMessage(chatId, `❌ Error: ${errorMessage}`);
      return;
    }

    // Get the highest resolution photo
    const photo = telegramService.getHighestResolutionPhoto(msg.photo);
    console.log(`📸 Downloading photo with file_id: ${photo.file_id}`);

    // Get the download link for the photo
    const fileUrl = await telegramService.getFileLink(photo.file_id);

    // Download the photo as a buffer
    const imageBuffer = await telegramService.downloadFile(fileUrl);
    console.log(`✅ Downloaded image, size: ${imageBuffer.length} bytes`);

    // Determine file extension (default to jpg if not available)
    const fileExtension = mimeToExtension(photo.mime_type);

    // Upload the image to Supabase Storage
    console.log(`☁️  Uploading image to Supabase Storage...`);
    const imageUrl = await supabaseService.uploadProductImage(imageBuffer, fileExtension);
    console.log(`✅ Image uploaded: ${imageUrl}`);

    // Create the product in the database
    console.log(`💾 Creating product in database...`);
    const product = await supabaseService.createProduct({
      name: parsedProduct.name,
      price: parsedProduct.price,
      description: parsedProduct.description,
      image_url: imageUrl,
    });

    console.log(`✅ Product created with ID: ${product.id}`);

    // Send success message
    await telegramService.sendMessage(
      chatId,
      `✅ Product '${parsedProduct.name}' added successfully.\n\n` +
      `💰 Price: $${parsedProduct.price.toFixed(2)}\n` +
      `🆔 Product ID: ${product.id}\n` +
      `🖼️  Image: ${imageUrl}`
    );

  } catch (error) {
    console.error('❌ Error in handleAddProduct:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await telegramService.sendMessage(
      chatId,
      `❌ Error adding product: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`
    );
  }
}
