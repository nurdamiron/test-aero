const AppError = require('../utils/AppError');

/**
 * Централизованный обработчик ошибок Middleware
 * Преобразует все ошибки в единообразный формат JSON
 * ДОЛЖЕН быть последним middleware в цепочке
 */
const errorHandler = (err, req, res, next) => {
  // Значения по умолчанию
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Что-то пошло не так';

  // Логирование деталей ошибки (в production используйте специальный сервис логирования)
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR] ОШИБКА:', err);
  } else {
    // В production логируем только код ошибки и сообщение (не стек трейс)
    console.error(`[ERROR] [${errorCode}] ${message}`);
  }

  // Обработка специфичных ошибок MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'USER_EXISTS';
    message = 'Пользователь с таким ID уже существует';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = 'Ресурс не найден';
  }

  // Обработка ошибок JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Недействительный токен';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Токен истек';
  }

  // Обработка ошибок Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = 'Размер файла превышает лимит 10MB';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Неожиданное поле в загрузке файла';
  }

  // Формирование ответа об ошибке
  const response = {
    error: message,
    code: errorCode
  };

  // В режиме разработки включить стек трейс
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
