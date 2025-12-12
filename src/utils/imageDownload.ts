import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";

// Node.js 18+ has native fetch support, no import needed

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const IMAGES_DIR = path.join(os.homedir(), "Images");

// Ensure the Images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`📁 Created directory: ${IMAGES_DIR}`);
}

export async function downloadImage(fileId: string): Promise<string> {
  try {
    // 1. Get file path from Telegram
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const data = await res.json();

    const filePath = (data as { result: { file_path: string } }).result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    console.log("📥 Downloading from:", fileUrl);

    // 2. Download file bytes
    const imageRes = await fetch(fileUrl);
    const buffer = await imageRes.arrayBuffer();

    // 3. Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(IMAGES_DIR, `telegram_${timestamp}.png`);

    // 4. Convert to PNG using sharp and save
    await sharp(Buffer.from(buffer))
      .png()
      .toFile(outputFile);

    console.log(`✅ Saved image as PNG: ${outputFile}`);
    return outputFile;
  } catch (error) {
    console.error("❌ Error downloading image:", error);
    throw error;
  }
}

// Keep backward compatibility with old export
export const downloadSticker = downloadImage;
export default downloadImage;