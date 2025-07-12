const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require("readline");
const { debounce } = require("../utils/utils");


const yesterday = parseInt((Date.now() / 1000) - (24 * 60 * 60));

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
function removeOldMessages() {

    cache.forEach((chat, index) => {
        const old_length = chat.length;
        chat = chat.filter(message => {
            return message.date >= yesterday;
        });
        console.log(`Updated cache ${index} , removed : ${old_length - chat.length}`);
        return chat;
    })


}
setInterval(removeOldMessages, 60 * 60 * 1000);


async function getMessagesForPeriod(fromTime) {
    const chatNezlamnosti = await debouncedGetMessages(-1001746152256);
    const yamiTuchi = await debouncedGetMessages(-1001886888533);

    const mergedArray = [...chatNezlamnosti, ...yamiTuchi];
    mergedArray.sort((a, b) => a.date - b.date);

    return mergedArray.filter((message) => message.date >= fromTime);
}

const debouncedGetMessages = debounce(getMessagesFromChatCached, 60000);

async function getMessagesFromChatCached(chatId) {
    let lastCachedMessage = null;
    let chatArray = [];

    if (cache.has(chatId)) {
        chatArray = cache.get(chatId);
        lastCachedMessage = chatArray.length > 0 ? chatArray[chatArray.length - 1] : null;
    } else {
        cache.set(chatId, chatArray);
    }

    const buffer = await getMessagesFromChat(chatId, lastCachedMessage);
    if (buffer.length > 0) {
        chatArray.push(...buffer);
        chatArray.sort((a, b) => a.date - b.date);
    }

    return chatArray;
}

async function getMessagesFromChat(chatId, lastMessage = null) {
    const chat = await client.getEntity(chatId);
    const limit = 100;
    let offsetId = 0;
    let buffer = [];
    generalLoop: while (true) {
        let messages = await client.getMessages(chat, {
            limit: limit,
            offsetId: offsetId,
        });

        if (messages.length === 0
            || (messages.length > 0 && messages[0].date < yesterday)) {
            break;
        }

        if (lastMessage == null) {
            buffer.push(...messages);
        } else {
            for (const message of messages) {
                if (message.id !== lastMessage.id) {
                    buffer.push(message);
                } else {
                    break generalLoop;
                }
            }
        }
        offsetId = messages[messages.length - 1].id;
    }
    return buffer.reverse();
}



module.exports = { client, getAvailableChanel, getMessagesForPeriod };
