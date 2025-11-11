const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Создание пула соединений с MySQL для лучшей производительности
 * Пул автоматически управляет соединениями и переиспользует их
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Ждать доступного соединения если пул занят
  connectionLimit: 10, // Максимум 10 одновременных соединений
  queueLimit: 0, // Неограниченная очередь запросов
  connectTimeout: 30000, // Таймаут подключения 30 секунд
  charset: 'utf8mb4', // Поддержка эмодзи и специальных символов
  timezone: '+00:00' // UTC timezone
});

/**
 * Тест подключения к БД при старте приложения
 * Если не удается подключиться - приложение не запустится
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('[OK] Database connected successfully');
    console.log(`[DB] Database: ${process.env.DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error.message);
    console.error('Проверьте .env файл и убедитесь что MySQL запущен');
    process.exit(1);
  }
};

// Запуск теста подключения
testConnection();

module.exports = pool;
