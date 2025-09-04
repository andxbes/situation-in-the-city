const fs = require('fs');
const path = require('path');
const util = require('util');

// Убедимся, что директория для логов существует
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const logToFile = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            // Используем util.inspect для лучшего отображения объектов и ошибок
            return util.inspect(arg, { showHidden: false, depth: null, colors: false });
        }
        return arg;
    }).join(' ');

    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    logStream.write(logMessage);
    console.log(logMessage.trim()); // Дублируем в консоль для удобства разработки
};

// --- Автоматическая очистка логов ---

const clearLogFile = () => {
    try {
        if (fs.existsSync(logFilePath)) {
            // Очищаем файл (устанавливаем его длину в 0)
            fs.truncateSync(logFilePath, 0);
            logToFile('info', 'Файл логов был автоматически очищен по расписанию.');
        }
    } catch (error) {
        logToFile('error', 'Ошибка при автоматической очистке файла логов:', error);
    }
};

// Запускаем очистку раз в сутки (24 часа * 60 минут * 60 секунд * 1000 миллисекунд)
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
setInterval(clearLogFile, ONE_DAY_IN_MS);

module.exports = {
    log: (...args) => logToFile('info', ...args),
    error: (...args) => logToFile('error', ...args),
    warn: (...args) => logToFile('warn', ...args),
};
