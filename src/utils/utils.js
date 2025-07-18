/**
 * Debounces an async function, caches results, and coalesces concurrent calls.
 *
 * @param {Function} func The async function to debounce.
 * @param {number} waitTime The duration in ms to cache the result.
 * @returns {Function} The new debounced function.
 */
function debounce(func, waitTime) {
    const cache = new Map();
    const ongoingRequests = new Map(); // Map<key, Promise>

    return async function (...args) {
        const key = JSON.stringify(args);
        const now = Date.now();

        // 1. Check cache for fresh data that is not expired
        if (cache.has(key) && (now - cache.get(key).time) < waitTime) {
            return cache.get(key).result;
        }

        // 2. Check if a request for the same key is already in flight
        if (ongoingRequests.has(key)) {
            return ongoingRequests.get(key);
        }

        // 3. Create a new request promise
        const requestPromise = func(...args).then(result => {
            cache.set(key, { result, time: Date.now() });
            ongoingRequests.delete(key);
            return result;
        }).catch(error => {
            ongoingRequests.delete(key);
            throw error; // Re-throw to the caller
        });

        ongoingRequests.set(key, requestPromise);
        return requestPromise;
    };
}

function getformatDateTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому добавляем 1
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getformatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    // const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}`;
}


// --- Constants for message filtering ---

// Using Set for faster lookups for single characters/emojis
const POSITIVE_EMOJIS = new Set([
    '🥒', '🍆', '🥦', '✅', '🟢', '⛔️', '☀️', '😡', '🌼', '🫒', '🟥', '🚨', '🛑',
    '🌞', '👌', '❌', '🪀', '🌳', '👹', '💚', '🤬', '🧶', '🌵', '🚓', '🚧', '🐸', '👮‍♂'
]);

const POSITIVE_WORDS = [
    'грязно', 'грязь', 'крепят', 'крепять', 'Ямы', 'Тучи',
    'чисто', 'чистота', 'чист', 'чистый',
    'чизт', 'тихо', 'норм', 'в норме', 'ок', 'ok',
    'оливок', 'оливки', 'оливками',
    'зеленых', 'зелень', 'зелени', 'синие', 'синих', 'ухилянт', 'пикселя', 'черные', 'мусора', 'пидары',
    'проверяют', 'упаковали', 'пресуют', 'пресують', 'пакуют', 'катаются',
    'проверка', 'пешие',
    'внимание', 'осторожно',
    'патруль', 'патрулька', 'тцк', 'копы', 'трукам', 'трубкам', 'люстра', 'люстры', 'бп',
    'черти', 'гнили', 'гниль',
    'волга', 'нива', 'ніва', 'ніве', 'ниве', 'бус', 'девятка', 'волга', 'амулет', 'форд', 'спринтер', 'транзіт', 'транзит', 'пирожок',
    'на[\\s]+военных[\\s]+номерах',
    '6778',
    'воины[\\s]+добра',
];

const NEGATIVE_KEYWORDS = new Set(['?', '¿', 'съебётся']);
const NEGATIVE_WORDS = [
    'бля', 'желательно', 'а какой', 'в ахуе', 'пох',
    'если', 'чево', 'чего', 'шотак', 'нахуй', 'блэт',
    'вайб', 'почему', 'долбоеб', 'далбаеб', 'хуй', 'пидар', 'съебётся',
    'вобщем', 'меня', 'долго', 'знакомого', 'говорили', 'мне', 'заебал', 'перед[\\s]тем',
    'потому[\\s]что', 'каждому', 'чувствовал', 'бежать', 'чувствовал',
    'для', 'даже', 'фильм', 'актёры', 'буду[\\s]знать',
    'вариант', 'развлекайся', 'перерва', 'пиво', 'водка', 'водки',
    'ты',
    'договор',
    'я',
    'фух'
];

// Compile regexes once and reuse them
const POSITIVE_REGEX = new RegExp(`(^|[\\s])(${POSITIVE_WORDS.join('|')})([\\s\\!\\.\\,]+|$)`, 'i');
const NEGATIVE_REGEX = new RegExp(`(^|[\\s])(${NEGATIVE_WORDS.join('|')})([\\s\\?\\.\\,\\!]|$)`, 'i');

const MAX_MESSAGE_LENGTH = 120;

function filter_messages(messages) {
    return messages.filter((message) => {
        const msg = message?.message;
        if (!msg || msg.length >= MAX_MESSAGE_LENGTH) {
            return false;
        }

        const hasPositiveEmoji = [...POSITIVE_EMOJIS].some(emoji => msg.includes(emoji));
        const hasPositiveWord = POSITIVE_REGEX.test(msg);
        const passesTrueCheck = hasPositiveEmoji || hasPositiveWord;

        if (!passesTrueCheck) {
            return false;
        }

        const hasNegativeKeyword = [...NEGATIVE_KEYWORDS].some(word => msg.includes(word));
        const hasNegativeWord = NEGATIVE_REGEX.test(msg);
        const passesFalseCheck = hasNegativeKeyword || hasNegativeWord;

        return !passesFalseCheck;
    });
}


module.exports = { getformatDateTime, getformatTime, filter_messages, debounce };
