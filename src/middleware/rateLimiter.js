const rateLimit = require('express-rate-limit');

/**
 * Ограничитель частоты запросов для /signin endpoint
 * Предотвращает атаки перебора
 * 20 попыток за 15 минут с одного IP (увеличено для тестирования)
 */
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // Максимум 20 запросов за период (увеличено с 5 для Newman тестов)
  message: {
    error: 'Слишком много попыток входа. Попробуйте снова через 15 минут',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Возврат информации о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false // Отключение заголовков `X-RateLimit-*`
});

/**
 * Ограничитель частоты запросов для загрузки файлов
 * Предотвращает спам-загрузки
 * 10 загрузок в минуту с одного IP
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // Максимум 10 загрузок в минуту
  message: {
    error: 'Слишком много загрузок файлов. Пожалуйста, замедлитесь',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  signinLimiter,
  uploadLimiter
};
