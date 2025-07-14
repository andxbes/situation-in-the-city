const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require("readline");

const stringSession = new StringSession(process.env.API_T_SESSION); // fill this later with the value from session.save()

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});


const client = new TelegramClient(stringSession,
    parseInt(process.env.API_T_ID),
    process.env.API_T_HASH, {
    connectionRetries: 5,
});
client.start({
    phoneNumber: async () =>
        new Promise((resolve) =>
            rl.question("Please enter your number: ", resolve)
        ),
    password: async () =>
        new Promise((resolve) =>
            rl.question("Please enter your password: ", resolve)
        ),
    phoneCode: async () =>
        new Promise((resolve) =>
            rl.question("Please enter the code you received: ", resolve)
        ),
    onError: (err) => console.log(err),
}).then(() => {
    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again to API_T_SESSION
});

// await client.sendMessage("me", { message: "Hello!" });




async function getAvailableChanel() {
    await client.connect();

    const dialogs = await client.getDialogs();

    // Фильтрация только каналов
    const channels = dialogs.filter((dialog) => dialog.isChannel);
    // console.log('chanel', channels); // prints the result
    console.log('Channels:');
    channels.forEach((channel) => {
        console.log(`Name: ${channel.title}, ID: ${channel.id}`);
    });
}

let cache = new Map();

// Keep track of the last fetch time for each chat to avoid spamming for new messages.
const cacheMetadata = new Map(); // { chatId -> { lastUpdate: timestamp } }

async function getMessagesForPeriod(fromTime) {
    // To make the cache key stable, we round the timestamp to the nearest minute.
    // The original `fromTime` is still used for the final filtering to ensure accuracy.
    const roundedFromTime = Math.floor(fromTime / 60) * 60;

    const chatNezlamnosti = await getMessagesFromChatCached(-1001746152256, roundedFromTime);
    const yamiTuchi = await getMessagesFromChatCached(-1001886888533, roundedFromTime);

    const mergedArray = [...chatNezlamnosti, ...yamiTuchi];
    mergedArray.sort((a, b) => a.date - b.date);

    // The final filtering is still necessary because the cache might contain messages
    // from a previous, wider request, and we only want to return what was asked for now.
    return mergedArray.filter((message) => message.date >= fromTime);
}

async function getMessagesFromChatCached(chatId, fromTime) {
    let chatArray = cache.get(chatId) || [];
    const meta = cacheMetadata.get(chatId) || { lastUpdate: 0 };

    const newestCachedMessage = chatArray.length > 0 ? chatArray[chatArray.length - 1] : null;
    const oldestCachedMessage = chatArray.length > 0 ? chatArray[0] : null;

    const now = Date.now();
    let newMessages = [];
    let olderMessages = [];
    let performedFetch = false;

    // Case 1: Cache is empty. Perform initial fetch.
    if (!oldestCachedMessage) {
        // Fetch everything from now down to the requested fromTime.
        olderMessages = await getMessagesFromChat(chatId, { minDate: fromTime });
        // No need to fetch "new" messages separately.
        performedFetch = true;
    } else {
        // Case 2: Cache has data. Fetch updates.

        // 2a. Fetch newer messages only if cache is stale (older than 60s)
        if (now - meta.lastUpdate > 60000) {
            newMessages = await getMessagesFromChat(chatId, { minId: newestCachedMessage.id });
            performedFetch = true; // We performed a check for new messages.
        }

        // 2b. Fetch older messages if the request requires them (user expanded the time range)
        if (fromTime < oldestCachedMessage.date) {
            olderMessages = await getMessagesFromChat(chatId, {
                maxId: oldestCachedMessage.id,
                minDate: fromTime,
            });
        }
    }

    // 3. If we fetched anything, update the cache and metadata
    if (performedFetch || olderMessages.length > 0) {
        // Combine all messages
        const allMessages = [...olderMessages, ...chatArray, ...newMessages];

        // Deduplicate, sort, and update the cache for the chat.
        const messageMap = new Map();
        allMessages.forEach(msg => messageMap.set(msg.id, msg));
        const uniqueMessages = Array.from(messageMap.values());
        uniqueMessages.sort((a, b) => a.date - b.date);

        cache.set(chatId, uniqueMessages);
        if (performedFetch) {
            cacheMetadata.set(chatId, { lastUpdate: now }); // Update timestamp only when we check for new messages
        }

        return uniqueMessages;
    }

    // 4. If we didn't fetch, just return the existing cache
    return chatArray;
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
    const chat = await client.getEntity(chatId);
    const limit = 100;
    let buffer = [];

    // Fetching newer messages (minId is specified)
    if (minId) {
        const messages = await client.getMessages(chat, { limit: 100, minId }); // Use a reasonable limit, as requested
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
}


module.exports = { client, getAvailableChanel, getMessagesForPeriod };
