const db = require('../config/database');

/**
 * Модель файла
 * Управление метаданными файлов с изоляцией владельцев
 * ВАЖНО: Все запросы ДОЛЖНЫ фильтроваться по user_id для предотвращения несанкционированного доступа
 */
class File {
  /**
   * Создание новой записи файла
   * @param {object} data - Метаданные файла
   * @returns {Promise<number>} - ID вставленного файла
   */
  static async create(data) {
    const {
      userId,
      filename,
      originalName,
      extension,
      mimeType,
      sizeBytes,
      storagePath
    } = data;

    const [result] = await db.execute(
      `INSERT INTO files
       (user_id, filename, original_name, extension, mime_type, size_bytes, storage_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, filename, originalName, extension, mimeType, sizeBytes, storagePath]
    );

    return result.insertId;
  }

  /**
   * Поиск файла по ID и пользователю
   * ВАЖНО: Всегда проверяет user_id для обеспечения владельца
   * @param {number} fileId - ID файла
   * @param {string} userId - Идентификатор пользователя
   * @returns {Promise<object|null>} - Объект файла или null
   */
  static async findByIdAndUser(fileId, userId) {
    const [rows] = await db.execute(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );
    return rows[0] || null;
  }

  /**
   * Получение постраничного списка файлов пользователя
   * @param {string} userId - Идентификатор пользователя
   * @param {number} limit - Количество файлов на странице
   * @param {number} offset - Смещение для пагинации
   * @returns {Promise<Array>} - Массив объектов файлов
   */
  static async findByUser(userId, limit, offset) {
    // Преобразование в целые числа для избежания проблем с привязкой параметров MySQL
    const limitInt = parseInt(limit, 10);
    const offsetInt = parseInt(offset, 10);

    const [rows] = await db.execute(
      `SELECT id, filename, original_name, extension, mime_type, size_bytes,
              uploaded_at, updated_at
       FROM files
       WHERE user_id = ?
       ORDER BY uploaded_at DESC
       LIMIT ${limitInt} OFFSET ${offsetInt}`,
      [userId]
    );
    return rows;
  }

  /**
   * Подсчет общего количества файлов пользователя
   * Используется для метаданных пагинации
   * @param {string} userId - Идентификатор пользователя
   * @returns {Promise<number>} - Общее количество файлов
   */
  static async countByUser(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as total FROM files WHERE user_id = ?',
      [userId]
    );
    return rows[0].total;
  }

  /**
   * Обновление метаданных файла
   * Используется при замене существующего файла
   * @param {number} fileId - ID файла
   * @param {object} data - Обновленные данные файла
   */
  static async update(fileId, data) {
    const {
      filename,
      originalName,
      extension,
      mimeType,
      sizeBytes,
      storagePath
    } = data;

    await db.execute(
      `UPDATE files
       SET filename = ?,
           original_name = ?,
           extension = ?,
           mime_type = ?,
           size_bytes = ?,
           storage_path = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [filename, originalName, extension, mimeType, sizeBytes, storagePath, fileId]
    );
  }

  /**
   * Удаление записи файла
   * ВАЖНО: Всегда проверяет user_id для обеспечения владельца
   * @param {number} fileId - ID файла
   * @param {string} userId - Идентификатор пользователя
   */
  static async delete(fileId, userId) {
    await db.execute(
      'DELETE FROM files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );
  }
}

module.exports = File;
