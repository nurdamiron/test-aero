const File = require('../models/File');
const AppError = require('../utils/AppError');
const path = require('path');
const fs = require('fs');
const { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } = require('../utils/constants');

/**
 * POST /file/upload
 * Загрузка нового файла
 */
exports.upload = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Проверка наличия загруженного файла
    if (!req.file) {
      throw new AppError('Файл не предоставлен', 400, 'VALIDATION_ERROR');
    }

    const file = req.file;

    // Сохранение метаданных файла в базу данных
    const fileId = await File.create({
      userId,
      filename: file.filename,
      originalName: file.originalname,
      extension: path.extname(file.originalname),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: file.path
    });

    res.status(201).json({
      fileId,
      filename: file.originalname,
      extension: path.extname(file.originalname).replace('.', ''),
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date().toISOString()
    });
  } catch (error) {
    // Если ошибка произошла после сохранения файла, удалить файл
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * GET /file/list
 * Получение постраничного списка файлов
 */
exports.list = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Парсинг параметров пагинации
    const page = parseInt(req.query.page) || DEFAULT_PAGE;
    const listSize = parseInt(req.query.list_size) || DEFAULT_PAGE_SIZE;

    // Расчет смещения
    const offset = (page - 1) * listSize;

    // Получение файлов и общего количества
    const [files, totalFiles] = await Promise.all([
      File.findByUser(userId, listSize, offset),
      File.countByUser(userId)
    ]);

    // Расчет общего количества страниц
    const totalPages = Math.ceil(totalFiles / listSize);

    // Форматирование ответа
    const formattedFiles = files.map(file => ({
      fileId: file.id,
      filename: file.original_name,
      extension: file.extension.replace('.', ''),
      mimeType: file.mime_type,
      size: file.size_bytes,
      uploadDate: file.uploaded_at
    }));

    res.status(200).json({
      files: formattedFiles,
      page,
      totalPages,
      totalFiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /file/:id
 * Получение метаданных файла
 */
exports.get = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id);

    // Поиск файла с проверкой владельца
    const file = await File.findByIdAndUser(fileId, userId);
    if (!file) {
      throw new AppError('Файл не найден', 404, 'NOT_FOUND');
    }

    res.status(200).json({
      fileId: file.id,
      filename: file.original_name,
      extension: file.extension.replace('.', ''),
      mimeType: file.mime_type,
      size: file.size_bytes,
      uploadDate: file.uploaded_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /file/download/:id
 * Скачивание файла
 */
exports.download = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id);

    // ВАЖНО: Проверка владельца
    const file = await File.findByIdAndUser(fileId, userId);
    if (!file) {
      throw new AppError('Файл не найден или доступ запрещен', 403, 'FORBIDDEN');
    }

    // Проверка существования файла на диске
    if (!fs.existsSync(file.storage_path)) {
      throw new AppError('Файл не найден в хранилище', 404, 'FILE_NOT_FOUND');
    }

    // Скачивание файла с оригинальным именем
    res.download(file.storage_path, file.original_name, (err) => {
      if (err) {
        console.error('Ошибка скачивания:', err);
        if (!res.headersSent) {
          next(new AppError('Не удалось скачать файл', 500, 'INTERNAL_SERVER_ERROR'));
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /file/update/:id
 * Обновление (замена) существующего файла
 */
exports.update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id);

    // Проверка загрузки нового файла
    if (!req.file) {
      throw new AppError('Файл не предоставлен', 400, 'VALIDATION_ERROR');
    }

    // ВАЖНО: Проверка владельца
    const existingFile = await File.findByIdAndUser(fileId, userId);
    if (!existingFile) {
      // Удаление загруженного файла, так как не можем его использовать
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw new AppError('Файл не найден или доступ запрещен', 403, 'FORBIDDEN');
    }

    const oldPath = existingFile.storage_path;
    const newFile = req.file;

    try {
      // Удаление старого файла с диска
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      // Обновление метаданных в базе данных
      await File.update(fileId, {
        filename: newFile.filename,
        originalName: newFile.originalname,
        extension: path.extname(newFile.originalname),
        mimeType: newFile.mimetype,
        sizeBytes: newFile.size,
        storagePath: newFile.path
      });

      res.status(200).json({
        fileId: fileId,
        filename: newFile.originalname,
        extension: path.extname(newFile.originalname).replace('.', ''),
        mimeType: newFile.mimetype,
        size: newFile.size,
        uploadDate: new Date().toISOString()
      });
    } catch (error) {
      // Откат: удаление нового файла, если обновление БД не удалось
      if (fs.existsSync(newFile.path)) {
        fs.unlinkSync(newFile.path);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /file/delete/:id
 * Удаление файла
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fileId = parseInt(req.params.id);

    // ВАЖНО: Проверка владельца
    const file = await File.findByIdAndUser(fileId, userId);
    if (!file) {
      throw new AppError('Файл не найден или доступ запрещен', 403, 'FORBIDDEN');
    }

    // Удаление с диска
    if (fs.existsSync(file.storage_path)) {
      fs.unlinkSync(file.storage_path);
    }

    // Удаление из базы данных
    await File.delete(fileId, userId);

    res.status(200).json({
      message: 'Файл успешно удален'
    });
  } catch (error) {
    next(error);
  }
};
