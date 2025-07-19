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


// Helper to check if a string is word-like (contains letters/numbers)
// to decide if it needs word boundaries in regex.
const isWordLike = (str) => /^[\p{L}\p{N}\s]+$/u.test(str);

// Helper to escape special regex characters.
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// --- Cache for compiled filters ---
let compiledFiltersCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 минут

/**
 * Gets keywords from DB, compiles them into regexes and symbol lists, and caches the result.
 * @returns {{
 *   positiveRegex: RegExp | null,
 *   positiveSymbols: string[],
 *   negativeRegex: RegExp | null,
 *   negativeSymbols: string[]
 * }}
 */
function getCompiledFilters() {
    const now = Date.now();
    if (compiledFiltersCache && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        return compiledFiltersCache;
    }

    const keywords = getFilterKeywords();

    const compiled = {
        positiveRegex: null,
        positiveSymbols: [],
        negativeRegex: null,
        negativeSymbols: [],
    };

    const positiveWordParts = [];
    const negativeWordParts = [];

    // Process positive keywords
    for (const kw of keywords.positive) {
        if (kw.is_regex) {
            positiveWordParts.push(kw.keyword); // Add raw regex
        } else if (isWordLike(kw.keyword)) {
            positiveWordParts.push(escapeRegex(kw.keyword));
        } else {
            compiled.positiveSymbols.push(kw.keyword.toLowerCase()); // For case-insensitive `includes`
        }
    }

    // Process negative keywords
    for (const kw of keywords.negative) {
        if (kw.is_regex) {
            negativeWordParts.push(kw.keyword);
        } else if (isWordLike(kw.keyword)) {
            negativeWordParts.push(escapeRegex(kw.keyword));
        } else {
            compiled.negativeSymbols.push(kw.keyword.toLowerCase());
        }
    }

    if (positiveWordParts.length > 0) {
        // Use Unicode-aware "word boundaries" via lookarounds because `\b` fails for Cyrillic.
        // The 'i' flag makes it case-insensitive. 'u' flag for unicode.
        compiled.positiveRegex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${positiveWordParts.join('|')})(?=[^\\p{L}\\p{N}]|$)`, 'iu');
    }

    if (negativeWordParts.length > 0) {
        compiled.negativeRegex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${negativeWordParts.join('|')})(?=[^\\p{L}\\p{N}]|$)`, 'iu');
    }

    compiledFiltersCache = compiled;
    cacheTimestamp = now;

    return compiled;
}

const MAX_MESSAGE_LENGTH = 120;

function filter_messages(messages) {
    const filters = getCompiledFilters();

    return messages.filter((message) => {
        const msg = message?.message; // Keep original case for regex
        if (!msg || msg.length >= MAX_MESSAGE_LENGTH) {
            return false;
        }
        const lowerCaseMsg = msg.toLowerCase();

        // Check for positive matches
        const hasPositiveSymbol = filters.positiveSymbols.some(symbol => lowerCaseMsg.includes(symbol));
        const hasPositiveWord = filters.positiveRegex ? filters.positiveRegex.test(msg) : false;
        const passesPositiveCheck = hasPositiveSymbol || hasPositiveWord;

        if (!passesPositiveCheck) {
            return false;
        }

        // Check for negative matches
        const hasNegativeSymbol = filters.negativeSymbols.some(symbol => lowerCaseMsg.includes(symbol));
        const hasNegativeWord = filters.negativeRegex ? filters.negativeRegex.test(msg) : false;
        const passesNegativeCheck = hasNegativeSymbol || hasNegativeWord;

        return !passesNegativeCheck;
    });
}


export { getformatDateTime, getformatTime, filter_messages, debounce };
