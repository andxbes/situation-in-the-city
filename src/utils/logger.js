const fs = require('fs');
const path = require('path');
const util = require('util');
const startTime = new Date(); // Запоминаем время старта приложения

// Убедимся, что директория для логов существует
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFilePath = path.join(logDir, 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const getUptime = () => {
    const uptimeMs = new Date() - startTime;
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}д ${hours}ч`;
};

const logToFile = (level, ...args) => {
    const timestamp = new Date().toISOString();
    const uptime = getUptime();
    const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            // Используем util.inspect для лучшего отображения объектов и ошибок
            return util.inspect(arg, { showHidden: false, depth: null, colors: false });
        }
        return arg;
    }).join(' ');

    const logMessage = `[${timestamp}] [UPTIME: ${uptime}] [${level.toUpperCase()}] ${message}\n`;
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

// --- Логирование завершения работы приложения ---

let isExiting = false; // Флаг, чтобы избежать повторного вызова

const cleanupAndExit = (options = { exitCode: 0 }, err) => {
    if (isExiting) return;
    isExiting = true;

    const { exitCode, signal } = options;
    const uptime = getUptime();
    let message = `Приложение завершает работу. Код выхода: ${exitCode}.`;
    let level = 'info';

    if (signal) {
        message = `Приложение остановлено сигналом: ${signal}. Код выхода: ${exitCode}.`;
    } else if (err) {
        level = 'error';
        message = `Критическая необработанная ошибка. Приложение аварийно завершает работу. Код выхода: ${exitCode}.\nОшибка: ${util.inspect(err)}`;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [UPTIME: ${uptime}] [${level.toUpperCase()}] ${message}\n`;

    // Используем синхронную запись, чтобы гарантировать сохранение лога перед выходом
    try {
        fs.appendFileSync(logFilePath, logMessage);
        console.log(logMessage.trim());
    } catch (err) {
        // Если даже лог не записать, выводим ошибку в консоль
        console.error('Критическая ошибка: не удалось записать лог о завершении работы.', err);
    }
    // Даем небольшой таймаут, чтобы убедиться, что все потоки I/O завершились,
    // перед принудительным выходом. Затем выходим.
    console.log(`Приложение будет завершено с кодом ${exitCode}...`);
    setTimeout(() => process.exit(exitCode), 500);
};

// --- Регистрация обработчиков завершения ---

// 1. Необработанные исключения (аварийное завершение)
process.on('uncaughtException', (err) => {
    console.error('Перехвачена необработанная ошибка:', err);
    cleanupAndExit({ exitCode: 1 }, err);
});

// 2. Сигналы завершения (штатное завершение)
process.on('SIGINT', () => cleanupAndExit({ exitCode: 0, signal: 'SIGINT' })); // Ctrl+C
process.on('SIGTERM', () => cleanupAndExit({ exitCode: 0, signal: 'SIGTERM' })); // 'kill'

// 3. Для nodemon
process.once('SIGUSR2', () => cleanupAndExit({ exitCode: 0, signal: 'SIGUSR2' }));


module.exports = {
    log: (...args) => logToFile('info', ...args),
    error: (...args) => logToFile('error', ...args),
    warn: (...args) => logToFile('warn', ...args),
};
