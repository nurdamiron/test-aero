/**
 * Пользовательский класс ошибок приложения
 * Используется для операционных ошибок (предсказуемых ошибок, таких как валидация, ошибки авторизации)
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Отличает от программных ошибок

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
