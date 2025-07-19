import { getFilterKeywords } from "@/database/filterKeywords";

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


// --- Кэширование для скомпилированных фильтров ---
let compiledFiltersCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 минут

/**
 * Получает ключевые слова из БД, компилирует регулярные выражения и кэширует результат.
 * @returns {{
 *   positiveEmojis: Set<string>,
 *   positiveRegex: RegExp | null,
 *   negativeKeywords: Set<string>,
 *   negativeRegex: RegExp | null
 * }}
 */
function getCompiledFilters() {
    const now = Date.now();
    if (compiledFiltersCache && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        return compiledFiltersCache;
    }

    const keywords = getFilterKeywords();

    const allPositiveWords = [
        ...keywords.positiveWords,
        ...keywords.positiveRegex,
    ];
    const allNegativeWords = [
        ...keywords.negativeWords,
        ...keywords.negativeRegex,
    ];

    const compiled = {
        positiveEmojis: keywords.positiveEmojis,
        positiveRegex: allPositiveWords.length > 0
            ? new RegExp(`(^|[\\s])(${allPositiveWords.join('|')})([\\s\\!\\.\\,]+|$)`, 'i')
            : null,
        negativeKeywords: keywords.negativeKeywords,
        negativeRegex: allNegativeWords.length > 0
            ? new RegExp(`(^|[\\s])(${allNegativeWords.join('|')})([\\s\\?\\.\\,\\!]|$)`, 'i')
            : null,
    };

    compiledFiltersCache = compiled;
    cacheTimestamp = now;

    return compiled;
}

const MAX_MESSAGE_LENGTH = 120;

function filter_messages(messages) {
    const filters = getCompiledFilters();

    return messages.filter((message) => {
        const msg = message?.message;
        if (!msg || msg.length >= MAX_MESSAGE_LENGTH) {
            return false;
        }

        const hasPositiveEmoji = [...filters.positiveEmojis].some(emoji => msg.includes(emoji));
        const hasPositiveWord = filters.positiveRegex ? filters.positiveRegex.test(msg) : false;
        const passesTrueCheck = hasPositiveEmoji || hasPositiveWord;

        if (!passesTrueCheck) {
            return false;
        }

        const hasNegativeKeyword = [...filters.negativeKeywords].some(word => msg.includes(word));
        const hasNegativeWord = filters.negativeRegex ? filters.negativeRegex.test(msg) : false;
        const passesFalseCheck = hasNegativeKeyword || hasNegativeWord;

        return !passesFalseCheck;
    });
}


export { getformatDateTime, getformatTime, filter_messages, debounce };
