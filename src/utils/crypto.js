const crypto = require('crypto');

/**
 * Хеширование токена с использованием SHA-256
 * Используется для безопасного хранения access/refresh токенов в базе данных
 * @param {string} token - Токен в открытом виде
 * @returns {string} - Хешированный токен (64 hex символа)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Генерация случайной строки токена
 * Используется для создания refresh токенов
 * @param {number} length - Длина токена (по умолчанию: 80)
 * @returns {string} - Случайная строка токена
 */
const generateRandomToken = (length = 80) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

module.exports = {
  hashToken,
  generateRandomToken
};
