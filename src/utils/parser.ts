/**
 * Parsed product data from a message caption
 */
export interface ParsedProduct {
  name: string;
  price: number;
  description: string | null;
}

/**
 * Parsed order update data from a message
 */
export interface ParsedOrderUpdate {
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
}

/**
 * Parses a product caption in the format:
 * /add_product
 * Name: Product Name
 * Price: 99.99
 * Description: Product description
 *
 * @param caption - The message caption to parse
 * @returns Parsed product data
 * @throws Error if required fields are missing or invalid
 */
export function parseProductCaption(caption: string): ParsedProduct {
  // Remove the command from the caption
  const withoutCommand = caption.replace(/^\/add_product\s*/i, '').trim();

  // Extract key-value pairs
  const lines = withoutCommand.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const data: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    data[key] = value;
  }

  // Validate required fields
  if (!data.name) {
    throw new Error('Product name is required. Format: "Name: Product Name"');
  }

  if (!data.price) {
    throw new Error('Product price is required. Format: "Price: 99.99"');
  }

  // Parse and validate price
  const price = parseFloat(data.price);
  if (isNaN(price) || price < 0) {
    throw new Error(`Invalid price format: "${data.price}". Please use a number like 29.99`);
  }

  return {
    name: data.name,
    price: price,
    description: data.description || null,
  };
}

/**
 * Parses an order update command in the format:
 * /update_order <order_number> <status> [tracking=<tracking_number>]
 *
 * Example: /update_order 123 shipped tracking=1Z9999W99999999999
 *
 * @param text - The message text to parse
 * @returns Parsed order update data
 * @throws Error if required fields are missing or invalid
 */
export function parseOrderUpdate(text: string): ParsedOrderUpdate {
  // Remove the command prefix
  const withoutCommand = text.replace(/^\/update_order\s*/i, '').trim();

  if (!withoutCommand) {
    throw new Error('Order update requires order number and status. Format: /update_order <order_number> <status> [tracking=<tracking_number>]');
  }

  // Split by whitespace
  const parts = withoutCommand.split(/\s+/);

  if (parts.length < 2) {
    throw new Error('Order update requires order number and status. Format: /update_order <order_number> <status> [tracking=<tracking_number>]');
  }

  const orderNumber = parts[0];
  const status = parts[1];
  let trackingNumber: string | null = null;

  // Look for tracking parameter
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    if (part.toLowerCase().startsWith('tracking=')) {
      trackingNumber = part.substring('tracking='.length);
      break;
    }
  }

  // Validate order number
  if (!orderNumber || orderNumber.length === 0) {
    throw new Error('Order number cannot be empty');
  }

  // Validate status
  if (!status || status.length === 0) {
    throw new Error('Status cannot be empty');
  }

  return {
    orderNumber,
    status,
    trackingNumber,
  };
}

/**
 * Extracts the file extension from a file path or MIME type
 * @param filePath - File path or name
 * @returns File extension without the dot (e.g., 'jpg', 'png')
 */
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg'; // Default to jpg if no extension found
}

/**
 * Determines image file extension from MIME type
 * @param mimeType - The MIME type (e.g., 'image/jpeg')
 * @returns File extension (e.g., 'jpg')
 */
export function mimeToExtension(mimeType?: string): string {
  if (!mimeType) {
    return 'jpg';
  }

  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return mimeMap[mimeType.toLowerCase()] || 'jpg';
}
