const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  paginationValidation,
  fileIdValidation,
  validate
} = require('../middleware/validation');

/**
 * Маршруты управления файлами
 * Все маршруты требуют аутентификации
 */

// POST /file/upload - Загрузка нового файла
router.post(
  '/upload',
  authMiddleware,
  uploadLimiter, // Ограничение частоты: 10 загрузок в минуту
  upload.single('file'), // Middleware Multer
  fileController.upload
);

// GET /file/list - Получение постраничного списка файлов
router.get(
  '/list',
  authMiddleware,
  paginationValidation,
  validate,
  fileController.list
);

// GET /file/:id - Получение метаданных файла
router.get(
  '/:id',
  authMiddleware,
  fileIdValidation,
  validate,
  fileController.get
);

// GET /file/download/:id - Скачивание файла
router.get(
  '/download/:id',
  authMiddleware,
  fileIdValidation,
  validate,
  fileController.download
);

// PUT /file/update/:id - Обновление (замена) файла
router.put(
  '/update/:id',
  authMiddleware,
  fileIdValidation,
  validate,
  upload.single('file'),
  fileController.update
);

// DELETE /file/delete/:id - Удаление файла
router.delete(
  '/delete/:id',
  authMiddleware,
  fileIdValidation,
  validate,
  fileController.deleteFile
);

module.exports = router;
