const jwt = require('jsonwebtoken');
const { JWT_ACCESS_EXPIRY } = require('./constants');

/**
 * Генерация JWT access токена
 * @param {string} userId - Идентификатор пользователя (email или телефон)
 * @param {string} sessionId - UUID сессии
 * @returns {string} - Подписанный JWT токен
 */
const generateAccessToken = (userId, sessionId) => {
  return jwt.sign(
    {
      userId,
      sessionId,
      type: 'access'
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY
    }
  );
};

/**
 * Проверка и декодирование JWT access токена
 * @param {string} token - JWT токен для проверки
 * @returns {object} - Декодированные данные токена
 * @throws {Error} - Если токен недействителен или истек
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
