const db = require('../config/database');
const bcrypt = require('bcrypt');
const { BCRYPT_ROUNDS } = require('../utils/constants');

/**
 * Модель пользователя
 * Обработка аутентификации и управления пользователями
 */
class User {
  /**
   * Создание нового пользователя
   * @param {string} id - Идентификатор пользователя (email или телефон)
   * @param {string} password - Пароль в открытом виде
   * @returns {Promise<object>} - Созданный объект пользователя
   */
  static async create(id, password) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db.execute(
      'INSERT INTO users (id, password_hash) VALUES (?, ?)',
      [id, passwordHash]
    );

    return { id };
  }

  /**
   * Поиск пользователя по ID
   * @param {string} id - Идентификатор пользователя
   * @returns {Promise<object|null>} - Объект пользователя или null
   */
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Проверка пароля
   * @param {string} plainPassword - Пароль в открытом виде
   * @param {string} passwordHash - Хешированный пароль из базы данных
   * @returns {Promise<boolean>} - True если пароль совпадает
   */
  static async verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  /**
   * Проверка существования пользователя
   * @param {string} id - Идентификатор пользователя
   * @returns {Promise<boolean>} - True если пользователь существует
   */
  static async exists(id) {
    const user = await this.findById(id);
    return user !== null;
  }
}

module.exports = User;
