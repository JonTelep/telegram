import type TelegramBot from 'node-telegram-bot-api';

export const handleTextMessage = async (msg: TelegramBot.Message) => {
  console.log('📝 Text Message Received:');
  console.log('  Chat ID:', msg.chat.id);
  console.log('  User:', msg.from?.username || msg.from?.first_name);
  console.log('  Message:', msg.text);
  console.log('  Timestamp:', new Date(msg.date * 1000).toISOString());
};

export const handlePhotoMessage = async (msg: TelegramBot.Message) => {
  console.log('📷 Photo Message Received:');
  console.log('  Chat ID:', msg.chat.id);
  console.log('  User:', msg.from?.username || msg.from?.first_name);
  console.log('  Caption:', msg.caption || '(no caption)');
  console.log('  Photo Count:', msg.photo?.length || 0);
  console.log('  Timestamp:', new Date(msg.date * 1000).toISOString());
};

export const handleCommand = async (msg: TelegramBot.Message) => {
  console.log('⚡ Command Received:');
  console.log('  Chat ID:', msg.chat.id);
  console.log('  User:', msg.from?.username || msg.from?.first_name);
  console.log('  Command:', msg.text);
  console.log('  Timestamp:', new Date(msg.date * 1000).toISOString());
};
