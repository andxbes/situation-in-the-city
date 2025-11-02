// Эта функция будет вызвана один раз при старте сервера.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const logger = require('./utils/logger.js');
        logger.log('Приложение запускается. Обработчики логирования успешно зарегистрированы.');
    }
}
