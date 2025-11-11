# ERP.AERO - REST API

REST API с JWT аутентификацией, управлением сессиями и загрузкой файлов.

## Возможности

- JWT аутентификация (access + refresh токены)
- Поддержка нескольких устройств
- Загрузка и скачивание файлов
- Пагинация списка файлов
- Защита от брутфорса
- Валидация входных данных
- CORS
- Docker

## Технологии

- Node.js 18+
- Express.js 5.x
- MySQL 8.0
- jsonwebtoken, bcrypt
- multer
- express-validator
- express-rate-limit

## Быстрый старт

### Автоматическая установка

```bash
git clone <repository-url>
cd test-aero-erp
chmod +x setup.sh
./setup.sh
npm start
```

Скрипт setup.sh автоматически:
- Установит npm зависимости
- Сгенерирует JWT секреты
- Запустит MySQL в Docker
- Применит миграции БД

### Ручная установка

```bash
# Установка зависимостей
npm install

# Настройка БД
mysql -u root -p
CREATE DATABASE erp_aero;
CREATE USER 'erp_user'@'localhost' IDENTIFIED BY 'erp_password';
GRANT ALL PRIVILEGES ON erp_aero.* TO 'erp_user'@'localhost';
exit

# Миграции
mysql -u erp_user -p erp_aero < migrations/init.sql

# Конфигурация
cp .env.example .env

# Сгенерировать JWT секреты:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Вставить в .env как JWT_ACCESS_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Вставить в .env как JWT_REFRESH_SECRET

# Запуск
npm start
```

## Настройка .env

```bash
NODE_ENV=development
PORT=3333

DB_HOST=localhost
DB_PORT=3306
DB_USER=erp_user
DB_PASSWORD=erp_password
DB_NAME=erp_aero

JWT_ACCESS_SECRET=ваш_access_секрет
JWT_REFRESH_SECRET=ваш_refresh_секрет
JWT_ACCESS_EXPIRY=10m
JWT_REFRESH_EXPIRY=7d

BCRYPT_ROUNDS=10
CORS_ORIGIN=*
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

## API

### Аутентификация

**Регистрация**
```http
POST /signup
Content-Type: application/json

{
  "id": "user@example.com",
  "password": "password123"
}
```

**Вход**
```http
POST /signin
Content-Type: application/json

{
  "id": "user@example.com",
  "password": "password123"
}
```

**Обновление токена**
```http
POST /signin/new_token
Content-Type: application/json

{
  "refreshToken": "..."
}
```

**Выход**
```http
GET /logout
Authorization: Bearer <token>
```

**Информация о пользователе**
```http
GET /info
Authorization: Bearer <token>
```

### Файлы

**Загрузка**
```http
POST /file/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Список файлов**
```http
GET /file/list?page=1&list_size=10
Authorization: Bearer <token>
```

**Информация о файле**
```http
GET /file/:id
Authorization: Bearer <token>
```

**Скачивание**
```http
GET /file/download/:id
Authorization: Bearer <token>
```

**Обновление**
```http
PUT /file/update/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Удаление**
```http
DELETE /file/delete/:id
Authorization: Bearer <token>
```

## Тестирование

### Postman
```bash
# Импортировать ERP-AERO.postman_collection.json в Postman
```

### Newman
```bash
npm install -g newman
newman run ERP-AERO.postman_collection.json
```

### cURL
```bash
# Регистрация
curl -X POST http://localhost:3333/signup \
  -H "Content-Type: application/json" \
  -d '{"id":"test@example.com","password":"test123"}'

# Загрузка файла
curl -X POST http://localhost:3333/file/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```

## Структура проекта

```
src/
├── config/          # Конфигурация БД, CORS, Multer
├── middleware/      # Аутентификация, валидация, rate limiting
├── models/          # User, Session, File
├── controllers/     # Бизнес-логика
├── routes/          # Маршруты
├── utils/           # JWT, crypto, ошибки
└── app.js           # Точка входа
```

## Безопасность

- Хеширование паролей через bcrypt
- SHA-256 хеши токенов в БД
- Ротация refresh токенов
- Валидация сессий в БД
- Rate limiting на вход и загрузку
- Валидация входных данных
- Проверка владельца файлов

## Лицензия

MIT
