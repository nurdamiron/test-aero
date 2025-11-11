const cors = require('cors');

/**
 * Конфигурация CORS - разрешает запросы с любых доменов согласно требованиям ТЗ
 * ВАЖНО: В продакшене рекомендуется изменить origin на конкретный домен
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Разрешить все домены (можно настроить через .env)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешенные HTTP методы
  allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
  credentials: true, // Разрешить отправку cookies
  maxAge: 86400 // Кэширование preflight запросов на 24 часа
};

module.exports = cors(corsOptions);
