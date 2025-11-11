/**
 * Middleware логирования запросов
 * Логирует все входящие запросы для отладки и мониторинга
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Логирование запроса
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Логирование ответа при завершении
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusLabel = status >= 500 ? '[ERROR]' : status >= 400 ? '[WARN]' : '[OK]';

    console.log(
      `${statusLabel} ${req.method} ${req.path} - ${status} (${duration}ms)`
    );
  });

  next();
};

module.exports = requestLogger;
