const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { signinLimiter } = require('../middleware/rateLimiter');
const {
  authValidation,
  refreshTokenValidation,
  validate
} = require('../middleware/validation');

/**
 * Маршруты аутентификации
 */

// POST /signup - Регистрация нового пользователя
router.post(
  '/signup',
  authValidation,
  validate,
  authController.signup
);

// POST /signin - Авторизация пользователя
router.post(
  '/signin',
  signinLimiter, // Ограничение частоты: 5 попыток за 15 минут
  authValidation,
  validate,
  authController.signin
);

// POST /signin/new_token - Обновление access токена
router.post(
  '/signin/new_token',
  refreshTokenValidation,
  validate,
  authController.signinNewToken
);

// GET /logout - Выход (удаление текущей сессии)
router.get(
  '/logout',
  authMiddleware, // Требует аутентификации
  authController.logout
);

// GET /info - Получение информации о текущем пользователе
router.get(
  '/info',
  authMiddleware, // Требует аутентификации
  authController.info
);

module.exports = router;
