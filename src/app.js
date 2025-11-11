const express = require('express');
require('dotenv').config();

// Валидация переменных окружения
const validateEnv = require('./config/validateEnv');
validateEnv();

// Подключение к БД
require('./config/database');

// Middleware
const corsMiddleware = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Роуты
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');

const app = express();

// Логирование запросов (только в dev режиме)
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Парсинг body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(corsMiddleware);

// Поддержка proxy
app.set('trust proxy', 1);

// Проверка здоровья
app.get('/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Роуты аутентификации (монтируются в корне)
app.use('/', authRoutes);

// Роуты для работы с файлами (монтируются по пути /file)
app.use('/file', fileRoutes);

// ============================================================================
// Обработка ошибок
// ============================================================================

// Обработчик 404 ошибок - должен быть после всех роутов
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Глобальный обработчик ошибок - должен быть последним!
app.use(errorHandler);

// ============================================================================
// Запуск сервера
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('ERP.AERO Server Started');
  console.log('='.repeat(50));
  console.log(`Port:        ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time:        ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /signup');
  console.log('  POST   /signin');
  console.log('  POST   /signin/new_token');
  console.log('  GET    /logout');
  console.log('  GET    /info');
  console.log('  POST   /file/upload');
  console.log('  GET    /file/list');
  console.log('  GET    /file/:id');
  console.log('  GET    /file/download/:id');
  console.log('  PUT    /file/update/:id');
  console.log('  DELETE /file/delete/:id');
  console.log('');
});

// Graceful shutdown - корректное завершение работы сервера
process.on('SIGTERM', () => {
  console.log('SIGTERM получен. Корректное завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT получен. Корректное завершение работы...');
  process.exit(0);
});

module.exports = app;
