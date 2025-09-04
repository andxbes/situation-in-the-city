const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const logger = require("@/utils/logger"); // Импортируем наш логгер

const stringSession = new StringSession(process.env.API_T_SESSION); // fill this later with the value from session.save()

const client = new TelegramClient(stringSession,
    parseInt(process.env.API_T_ID),
    process.env.API_T_HASH, {
    connectionRetries: 5,
});

// ВАЖНО: Этот блок `client.start` предназначен только для ОДНОРАЗОВОГО
// интерактивного запуска, чтобы сгенерировать строку сессии (API_T_SESSION).
// Он НЕ ДОЛЖЕН выполняться на сервере, так как он будет ждать ввода в консоли,
// что и вызывает "зависание" вашего API.
// Для генерации сессии, раскомментируйте этот блок, запустите `node src/tg/tclient.js`,
// введите данные, скопируйте полученную строку сессии и вставьте ее в .env файл.
// После этого ОБЯЗАТЕЛЬНО закомментируйте этот блок обратно.
/*
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

(async () => {
    await client.start({
        phoneNumber: async () => await rl.question('Please enter your number: '),
        password: async () => await rl.question('Please enter your password: '),
        phoneCode: async () => await rl.question('Please enter the code you received: '),
        onError: (err) => logger.error('Telegram client error:', err),
    });
    logger.log('You should now be connected.');
    logger.log('Your session string is:', client.session.save());
    await client.disconnect();
    process.exit(0);
})();
*/

// await client.sendMessage("me", { message: "Hello!" });




async function getAvailableChanel() {
    try {
        if (!client.connected) {
            await client.connect();
        }
        const dialogs = await client.getDialogs();
        const channels = dialogs.filter((dialog) => dialog.isChannel);
        logger.log('Available Channels:');
        channels.forEach((channel) => {
            logger.log(`Name: ${channel.title}, ID: ${channel.id}`);
        });
    } catch (error) {
        logger.error('Failed to get available channels:', error);
    }
}

let cache = new Map();

// Метаданные для кэша, чтобы отслеживать время последнего обновления.
// { chatId -> { lastUpdate: timestamp } }
const cacheMetadata = new Map();

// --- Периодическая очистка кэша ---

/**
 * Удаляет из кэша сообщения старше 24 часов.
 */
function removeOldMessages() {
    // Telegram-даты в секундах, Date.now() в миллисекундах.
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

    cache.forEach((messages, chatId) => {
        const old_length = messages.length;
        const updatedMessages = messages.filter(message => {
            // message.date - это unix timestamp в секундах
            return message.date >= twentyFourHoursAgo;
        });

        if (updatedMessages.length < old_length) {
            cache.set(chatId, updatedMessages);
            logger.log(`Cache cleanup for chat ${chatId}: removed ${old_length - updatedMessages.length} old messages.`);
        }
    });
}

// Запускаем очистку каждый час.
setInterval(removeOldMessages, 60 * 60 * 1000);

client.addEventHandler((event) => {
    // Логируем любые события, особенно отключения, чтобы понимать, что происходит
    if (event.className === 'UpdateConnectionState') {
        logger.warn('Telegram connection state changed:', event.state);
    }
});

async function getMessagesForPeriod(fromTime) {
    // To make the cache key stable, we round the timestamp to the nearest minute.
    // The original `fromTime` is still used for the final filtering to ensure accuracy.
    const roundedFromTime = Math.floor(fromTime / 60) * 60;
    logger.log(`Fetching messages for period from ${new Date(fromTime * 1000).toISOString()}`);

    const [chatNezlamnosti, yamiTuchi] = await Promise.all([
        getMessagesFromChatCached(-1001746152256, roundedFromTime),
        getMessagesFromChatCached(-1001886888533, roundedFromTime)
    ]);

    const mergedArray = [...(chatNezlamnosti || []), ...(yamiTuchi || [])];
    mergedArray.sort((a, b) => a.date - b.date); // Сортируем сообщения по дате

    // The final filtering is still necessary because the cache might contain messages
    // from a previous, wider request, and we only want to return what was asked for now.
    return mergedArray.filter((message) => message.date >= fromTime);
}

async function getMessagesFromChatCached(chatId, fromTime) {
    const fetchStartTime = Date.now();
    try {
        let chatArray = cache.get(chatId) || [];
        const meta = cacheMetadata.get(chatId) || { lastUpdate: 0 };

        const newestCachedMessage = chatArray.length > 0 ? chatArray[chatArray.length - 1] : null;
        const oldestCachedMessage = chatArray.length > 0 ? chatArray[0] : null;

        const now = Date.now();
        let newMessages = [];
        let olderMessages = [];
        let performedFetchForNew = false;

        // Случай 1: Кэш пуст. Выполняем первоначальную загрузку.
        if (!oldestCachedMessage) {
            logger.log(`Cache empty for chat ${chatId}. Performing initial fetch.`);
            olderMessages = await getMessagesFromChat(chatId, { minDate: fromTime });
            performedFetchForNew = true; // Мы загрузили все, включая новые
        } else {
            // Случай 2: В кэше есть данные. Загружаем обновления.

            // 2a. Загружаем новые сообщения, только если кэш "устарел" (старше 60 секунд)
            if (now - meta.lastUpdate > 60000) {
                logger.log(`Cache stale for chat ${chatId}. Fetching new messages.`);
                newMessages = await getMessagesFromChat(chatId, { minId: newestCachedMessage.id });
                performedFetchForNew = true;
            }

            // 2b. Загружаем более старые сообщения, если они требуются для запроса
            if (fromTime < oldestCachedMessage.date) {
                logger.log(`Request requires older messages for chat ${chatId}. Fetching.`);
                olderMessages = await getMessagesFromChat(chatId, {
                    maxId: oldestCachedMessage.id,
                    minDate: fromTime,
                });
            }
        }

        // 3. Если мы что-то загрузили, обновляем кэш и метаданные
        if (newMessages.length > 0 || olderMessages.length > 0) {
            logger.log(`Updating cache for chat ${chatId}. New: ${newMessages.length}, Older: ${olderMessages.length}`);
            const allMessages = [...olderMessages, ...chatArray, ...newMessages];

            // Дедупликация, сортировка и обновление кэша
            const messageMap = new Map();
            allMessages.forEach(msg => messageMap.set(msg.id, msg));
            const uniqueMessages = Array.from(messageMap.values());
            uniqueMessages.sort((a, b) => a.date - b.date);

            cache.set(chatId, uniqueMessages);
            if (performedFetchForNew) {
                cacheMetadata.set(chatId, { lastUpdate: now });
            }

            logger.log(`getMessagesFromChatCached for chat ${chatId} took ${Date.now() - fetchStartTime}ms. Returning ${uniqueMessages.length} messages.`);
            return uniqueMessages;
        }

        // 4. Если ничего не загружали, просто возвращаем существующий кэш
        logger.log(`getMessagesFromChatCached for chat ${chatId} took ${Date.now() - fetchStartTime}ms. Returning ${chatArray.length} messages from cache.`);
        return chatArray;

    } catch (error) {
        logger.error(`Failed to get messages for chat ${chatId}:`, error);
        // В случае ошибки возвращаем то, что есть в кэше, чтобы не обрушить приложение
        return cache.get(chatId) || [];
    }
}

/**
 * Fetches messages from a chat with flexible options.
 * @param {number} chatId - The ID of the chat.
 * @param {object} [options={}] - The options for fetching messages.
 * @param {number} [options.minId] - Fetch messages with an ID greater than this. Used for getting newer messages.
 * @param {number} [options.maxId] - Fetch messages with an ID lower than this. Used for getting older messages.
 * @param {number} [options.minDate] - The minimum date (unix timestamp) for messages to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of messages.
 */
async function getMessagesFromChat(chatId, { minId, maxId, minDate } = {}) {
    try {
        if (!client.connected) {
            logger.log('Telegram client not connected. Connecting...');
            await client.connect();
        }

        const chat = await client.getEntity(chatId);
        const limit = 100;
        let buffer = [];

        // Fetching newer messages (minId is specified)
        if (minId) {
            const messages = await client.getMessages(chat, { limit: 100, minId });
            return messages.reverse();
        }

        // Fetching older messages (maxId or no id specified)
        let offsetId = maxId || 0;
        while (true) {
            const messages = await client.getMessages(chat, { limit, offsetId });

            if (messages.length === 0) break;

            let stop = false;
            for (const message of messages) {
                if (minDate && message.date < minDate) {
                    stop = true;
                    break;
                }
                buffer.push(message);
            }

            if (stop) break;

            offsetId = messages[messages.length - 1].id;
        }
        return buffer.reverse();
    } catch (error) {
        logger.error(`Error in getMessagesFromChat for chat ${chatId}:`, error);
        throw error; // Пробрасываем ошибку выше, чтобы ее обработал getMessagesFromChatCached
    }
}


module.exports = { client, getAvailableChanel, getMessagesForPeriod };
