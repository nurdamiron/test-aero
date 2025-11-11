const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const { generateAccessToken } = require('../utils/jwt');
const { hashToken, generateRandomToken } = require('../utils/crypto');
const { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = require('../utils/constants');

/**
 * Преобразование времени истечения в миллисекунды
 * @param {string} expiry - Строка времени типа '10m', '7d'
 * @returns {number} - Миллисекунды
 */
const parseExpiry = (expiry) => {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 10 * 60 * 1000; // По умолчанию 10 минут
  return parseInt(match[1]) * units[match[2]];
};

/**
 * POST /signup
 * Регистрация нового пользователя и возврат токенов
 * ВАЖНО: Пользователь автоматически авторизуется после регистрации
 */
exports.signup = async (req, res, next) => {
  try {
    const { id, password } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findById(id);
    if (existingUser) {
      throw new AppError('Пользователь с таким ID уже существует', 409, 'USER_EXISTS');
    }

    // Создание пользователя
    await User.create(id, password);

    // Генерация токенов
    const accessToken = generateAccessToken(id, ''); // sessionId будет установлен после создания
    const refreshToken = generateRandomToken();

    // Расчет времени истечения
    const accessExpiresAt = new Date(Date.now() + parseExpiry(JWT_ACCESS_EXPIRY));
    const refreshExpiresAt = new Date(Date.now() + parseExpiry(JWT_REFRESH_EXPIRY));

    // Создание сессии
    const sessionId = await Session.create({
      userId: id,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      deviceInfo: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
      accessExpiresAt,
      refreshExpiresAt
    });

    // Перегенерация access token с корректным sessionId
    const finalAccessToken = generateAccessToken(id, sessionId);

    // Обновление сессии с корректным хешем access token
    await Session.update(sessionId, {
      accessTokenHash: hashToken(finalAccessToken),
      refreshTokenHash: hashToken(refreshToken),
      accessExpiresAt,
      refreshExpiresAt
    });

    res.status(201).json({
      accessToken: finalAccessToken,
      refreshToken,
      accessTokenExpiry: JWT_ACCESS_EXPIRY
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /signin
 * Авторизация пользователя и создание новой сессии
 * ВАЖНО: Каждая авторизация создает НОВУЮ сессию (поддержка мультиустройств)
 */
exports.signin = async (req, res, next) => {
  try {
    const { id, password } = req.body;

    // Поиск пользователя
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Неверный ID или пароль', 401, 'INVALID_CREDENTIALS');
    }

    // Проверка пароля
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Неверный ID или пароль', 401, 'INVALID_CREDENTIALS');
    }

    // Генерация токенов
    const accessToken = generateAccessToken(id, ''); // sessionId будет установлен после создания
    const refreshToken = generateRandomToken();

    // Расчет времени истечения
    const accessExpiresAt = new Date(Date.now() + parseExpiry(JWT_ACCESS_EXPIRY));
    const refreshExpiresAt = new Date(Date.now() + parseExpiry(JWT_REFRESH_EXPIRY));

    // Создание новой сессии (ДОБАВЛЕНИЕ, не замена!)
    const sessionId = await Session.create({
      userId: id,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      deviceInfo: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
      accessExpiresAt,
      refreshExpiresAt
    });

    // Перегенерация access token с корректным sessionId
    const finalAccessToken = generateAccessToken(id, sessionId);

    // Обновление сессии с корректным хешем access token
    await Session.update(sessionId, {
      accessTokenHash: hashToken(finalAccessToken),
      refreshTokenHash: hashToken(refreshToken),
      accessExpiresAt,
      refreshExpiresAt
    });

    res.status(200).json({
      accessToken: finalAccessToken,
      refreshToken,
      accessTokenExpiry: JWT_ACCESS_EXPIRY
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /signin/new_token
 * Обновление access token с помощью refresh token
 * ВАЖНО: Реализует одноразовую ротацию refresh token
 */
exports.signinNewToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Хеширование refresh token
    const refreshTokenHash = hashToken(refreshToken);

    // Поиск сессии по refresh token
    const session = await Session.findByRefreshTokenHash(refreshTokenHash);
    if (!session) {
      throw new AppError('Недействительный или истекший refresh token', 401, 'TOKEN_EXPIRED');
    }

    // Проверка истечения refresh token
    if (new Date() > new Date(session.refresh_expires_at)) {
      throw new AppError('Refresh token истек', 401, 'TOKEN_EXPIRED');
    }

    // Генерация НОВЫХ токенов (ротация)
    const newAccessToken = generateAccessToken(session.user_id, session.session_id);
    const newRefreshToken = generateRandomToken();

    // Расчет нового времени истечения
    const accessExpiresAt = new Date(Date.now() + parseExpiry(JWT_ACCESS_EXPIRY));
    const refreshExpiresAt = new Date(Date.now() + parseExpiry(JWT_REFRESH_EXPIRY));

    // Обновление сессии с новыми токенами
    // ВАЖНО: Старый refresh token заменяется (паттерн одноразового использования!)
    await Session.update(session.session_id, {
      accessTokenHash: hashToken(newAccessToken),
      refreshTokenHash: hashToken(newRefreshToken),
      accessExpiresAt,
      refreshExpiresAt
    });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiry: JWT_ACCESS_EXPIRY
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /logout
 * Выход из текущей сессии
 * ВАЖНО: Удаляет только ТЕКУЩУЮ сессию, а не все сессии пользователя
 */
exports.logout = async (req, res, next) => {
  try {
    const { id: userId, sessionId } = req.user;

    // Удаление только текущей сессии
    await Session.deleteBySessionId(sessionId, userId);

    res.status(200).json({
      message: 'Успешный выход из системы'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /info
 * Получение информации о текущем пользователе
 */
exports.info = async (req, res, next) => {
  try {
    const { id } = req.user;

    res.status(200).json({
      id
    });
  } catch (error) {
    next(error);
  }
};

