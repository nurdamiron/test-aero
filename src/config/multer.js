const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const AppError = require('../utils/AppError');
const { ALLOWED_MIMES, MAX_FILE_SIZE, UPLOAD_DIR } = require('../utils/constants');

// Проверка существования директории для загрузок
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Генерация уникального имени файла: timestamp_random.ext
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${ext}`;
    cb(null, filename);
  }
});

// Фильтр файлов - белый список MIME типов
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Тип файла не разрешен', 422, 'INVALID_MIME'), false);
  }
};

// Экземпляр Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

module.exports = upload;
