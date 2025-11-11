/**
 * Константы приложения
 * Централизованные конфигурационные значения, используемые во всем приложении
 */

module.exports = {
  // Конфигурация JWT
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '10m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Конфигурация Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,

  // Конфигурация загрузки файлов
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  // Разрешенные MIME типы для загрузки файлов
  ALLOWED_MIMES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],

  // Коды ошибок
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    USER_EXISTS: 'USER_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_MIME: 'INVALID_MIME',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
  },

  // Значения по умолчанию для пагинации
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};
