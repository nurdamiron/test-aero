const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Модель сессии
 * Управление сессиями для мультиустройств
 * ВАЖНО: Поддерживает несколько активных сессий на пользователя (по одной на устройство)
 */
class Session {
  /**
   * Создание новой сессии
   * @param {object} data - Данные сессии
   * @returns {Promise<string>} - Созданный ID сессии (UUID)
   */
  static async create(data) {
    const {
      userId,
      accessTokenHash,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      accessExpiresAt,
      refreshExpiresAt
    } = data;

    const sessionId = uuidv4();

    await db.execute(
      `INSERT INTO sessions
       (session_id, user_id, access_token_hash, refresh_token_hash,
        device_info, ip_address, access_expires_at, refresh_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        accessTokenHash,
        refreshTokenHash,
        deviceInfo,
        ipAddress,
        accessExpiresAt,
        refreshExpiresAt
      ]
    );

    return sessionId;
  }

  /**
   * Поиск сессии по хешу refresh token
   * Используется в процессе обновления токена
   * @param {string} refreshTokenHash - SHA-256 хеш refresh token
   * @returns {Promise<object|null>} - Объект сессии или null
   */
  static async findByRefreshTokenHash(refreshTokenHash) {
    const [rows] = await db.execute(
      `SELECT * FROM sessions
       WHERE refresh_token_hash = ? AND is_active = TRUE`,
      [refreshTokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Поиск сессии по ID сессии
   * Используется для валидации сессии в auth middleware
   * @param {string} sessionId - UUID идентификатор сессии
   * @returns {Promise<object|null>} - Объект сессии или null
   */
  static async findBySessionId(sessionId) {
    const [rows] = await db.execute(
      'SELECT * FROM sessions WHERE session_id = ? AND is_active = TRUE',
      [sessionId]
    );
    return rows[0] || null;
  }

  /**
   * Обновление токенов сессии (для ротации refresh token)
   * ВАЖНО: Старый refresh token заменяется новым (паттерн одноразового использования)
   * @param {string} sessionId - UUID сессии
   * @param {object} data - Данные нового токена
   */
  static async update(sessionId, data) {
    const {
      accessTokenHash,
      refreshTokenHash,
      accessExpiresAt,
      refreshExpiresAt
    } = data;

    await db.execute(
      `UPDATE sessions
       SET access_token_hash = ?,
           refresh_token_hash = ?,
           access_expires_at = ?,
           refresh_expires_at = ?
       WHERE session_id = ?`,
      [
        accessTokenHash,
        refreshTokenHash,
        accessExpiresAt,
        refreshExpiresAt,
        sessionId
      ]
    );
  }

  /**
   * Удаление сессии по ID сессии
   * ВАЖНО: Удаляет только ТЕКУЩУЮ сессию, а не все сессии пользователя
   * Это позволяет поддерживать мультиустройства
   * @param {string} sessionId - UUID сессии
   * @param {string} userId - Идентификатор пользователя (для дополнительной безопасности)
   */
  static async deleteBySessionId(sessionId, userId) {
    await db.execute(
      'DELETE FROM sessions WHERE session_id = ? AND user_id = ?',
      [sessionId, userId]
    );
  }

  /**
   * Получение всех активных сессий пользователя
   * Полезно для функции "просмотр активных устройств"
   * @param {string} userId - Идентификатор пользователя
   * @returns {Promise<Array>} - Массив объектов сессий
   */
  static async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT session_id, device_info, ip_address, created_at, last_activity
       FROM sessions
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY last_activity DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Удаление истекших сессий (задача очистки)
   * Должна выполняться периодически (например, через cron job)
   */
  static async deleteExpired() {
    const [result] = await db.execute(
      'DELETE FROM sessions WHERE refresh_expires_at < NOW()'
    );
    return result.affectedRows;
  }
}

module.exports = Session;
