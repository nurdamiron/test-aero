const { verifyAccessToken } = require('../utils/jwt');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');

/**
 * Middleware аутентификации
 * Проверяет JWT токен и валидирует сессию в базе данных
 * КРИТИЧЕСКИ ВАЖНО: Проверка сессии в БД обеспечивает работу logout и мультиустройств
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Извлечение токена из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Убрать 'Bearer '

    // 2. Проверка подписи JWT и декодирование payload
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
    }

    // 3. КРИТИЧЕСКИ ВАЖНО: Валидация сессии в базе данных
    // Это обеспечивает инвалидацию токенов после logout
    const session = await Session.findBySessionId(decoded.sessionId);
    if (!session || !session.is_active) {
      throw new AppError('Session not found or inactive', 401, 'UNAUTHORIZED');
    }

    // 4. Проверка истечения access токена в БД (дополнительный уровень безопасности)
    if (new Date() > new Date(session.access_expires_at)) {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }

    // 5. Прикрепление информации о пользователе к объекту запроса
    req.user = {
      id: decoded.userId,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
