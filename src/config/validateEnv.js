/**
 * Валидация переменных окружения
 * Проверяет наличие всех необходимых переменных окружения
 * Выполняется при запуске приложения для быстрого обнаружения ошибок
 */

const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_NAME'
];

const validateEnv = () => {
  const missing = [];

  // Проверка отсутствующих переменных
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('[ERROR] Отсутствуют обязательные переменные окружения:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nПожалуйста, проверьте ваш .env файл и убедитесь, что все необходимые переменные установлены.');
    console.error('См. .env.example для справки.');
    process.exit(1);
  }

  // Валидация длины JWT секретов (должно быть минимум 32 символа)
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (accessSecret.length < 32) {
    console.error('[ERROR] JWT_ACCESS_SECRET должен содержать минимум 32 символа');
    console.error('Сгенерируйте безопасный секрет командой: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  if (refreshSecret.length < 32) {
    console.error('[ERROR] JWT_REFRESH_SECRET должен содержать минимум 32 символа');
    console.error('Сгенерируйте безопасный секрет командой: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  // Проверка различия access и refresh секретов
  if (accessSecret === refreshSecret) {
    console.error('[ERROR] JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны отличаться!');
    console.error('Это критично для безопасности.');
    process.exit(1);
  }

  console.log('[OK] Переменные окружения успешно провалидированы');
};

module.exports = validateEnv;
