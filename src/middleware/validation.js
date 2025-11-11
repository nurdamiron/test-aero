const { body, query, param, validationResult } = require('express-validator');

/**
 * Правила валидации
 * Использование express-validator для санитизации и валидации входных данных
 */

// Валидация для регистрации и входа
const authValidation = [
  body('id')
    .trim()
    .notEmpty().withMessage('ID обязателен')
    .isLength({ max: 255 }).withMessage('ID слишком длинный')
    .custom(value => {
      // Должен быть либо валидный email, либо номер телефона (начинающийся с +)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+[1-9]\d{1,14}$/;

      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('ID должен быть валидным email или номером телефона');
      }
      return true;
    }),

  body('password')
    .trim()
    .notEmpty().withMessage('Пароль обязателен')
    .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов')
    .isLength({ max: 100 }).withMessage('Пароль слишком длинный')
];

// Валидация refresh token
const refreshTokenValidation = [
  body('refreshToken')
    .trim()
    .notEmpty().withMessage('Refresh token обязателен')
    .isLength({ min: 64, max: 256 }).withMessage('Неверный формат refresh token')
];

// Валидация пагинации
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Страница должна быть положительным целым числом')
    .toInt(),

  query('list_size')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Размер списка должен быть от 1 до 100')
    .toInt()
];

// Валидация ID файла
const fileIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('Неверный ID файла')
    .toInt()
];

/**
 * Middleware для проверки результатов валидации
 * Если есть ошибки валидации, возвращает ответ 422
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Ошибка валидации',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  authValidation,
  refreshTokenValidation,
  paginationValidation,
  fileIdValidation,
  validate
};
