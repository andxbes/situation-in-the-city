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

module.exports = {
    log: (...args) => logToFile('info', ...args),
    error: (...args) => logToFile('error', ...args),
    warn: (...args) => logToFile('warn', ...args),
};
