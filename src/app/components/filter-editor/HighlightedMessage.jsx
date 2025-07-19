'use client';
import React, { useMemo } from 'react';

function escapeRegex(string) {
    // Escape characters with special meaning in regular expressions.
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// A check to see if a keyword should be treated as a "whole word".
// This is true for strings containing only Unicode letters, numbers, and spaces.
// Emojis, punctuation, etc., will return false and won't be wrapped in word boundaries `\b`.
const isWordLike = (str) => /^[\p{L}\p{N}\s]+$/u.test(str);

const HighlightedMessage = ({ text, keywords }) => {
    const { regex, keywordsMap } = useMemo(() => {
        if (!keywords || keywords.length === 0) {
            return { regex: null, keywordsMap: new Map() };
        }

        const map = new Map();
        const parts = {
            word: [],
            symbol: [],
            regex: [],
        };

        // 1. Group keywords by their nature to build a precise regex.
        for (const kw of keywords) {
            // The map is used later to get the keyword's type for styling.
            // We use toLowerCase() to make matching case-insensitive.
            map.set(kw.keyword.toLowerCase(), kw);

            if (kw.is_regex) {
                // These are raw regex patterns.
                parts.regex.push(kw.keyword);
            } else if (isWordLike(kw.keyword)) {
                // These are plain words or phrases.
                parts.word.push(escapeRegex(kw.keyword));
            } else {
                // These are emojis or symbols (e.g., '?', '✅').
                parts.symbol.push(escapeRegex(kw.keyword));
            }
        }

        const finalRegexParts = [];

        // 2. Build the final regex, prioritizing more specific patterns.
        // Regex keywords are most specific and go first.
        if (parts.regex.length > 0) {
            // We don't wrap these in anything, they are complete patterns.
            finalRegexParts.push(...parts.regex);
        }
        // Word-like keywords are wrapped in word boundaries `\b` to avoid matching parts of other words.
        if (parts.word.length > 0) {
            finalRegexParts.push(`\\b(${parts.word.join('|')})\\b`);
        }
        // Symbols and emojis are matched as-is, without word boundaries.
        if (parts.symbol.length > 0) {
            finalRegexParts.push(parts.symbol.join('|'));
        }

        if (finalRegexParts.length === 0) {
            return { regex: null, keywordsMap: new Map() };
        }

        // 3. Create a single, case-insensitive, Unicode-aware regex to find all keywords.
        // The outer parentheses create a capturing group for the entire match,
        // which is essential for using `text.split()` to preserve both matches and non-matches.
        const regex = new RegExp(`(${finalRegexParts.join('|')})`, 'giu');
        return { regex, keywordsMap: map };
    }, [keywords]);

    if (!regex || !text) {
        return <p className="text-sm text-left text-gray-800 dark:text-gray-200">{text}</p>;
    }

    // `split` with a capturing regex returns an array of alternating non-matches and matches.
    // e.g., "hello? world".split(/(\?)/) => ["hello", "?", " world"]
    const parts = text.split(regex);

    return (
        <p className="text-sm text-left text-gray-800 dark:text-gray-200" style={{ whiteSpace: 'pre-wrap' }}>
            {parts.map((part, i) => {
                if (!part) return null; // `split` can produce empty strings, which we can ignore.

                // Check if the current part is a keyword we need to highlight.
                // We use toLowerCase() to match the key in our map.
                const keywordData = keywordsMap.get(part.toLowerCase());
                const className = keywordData
                    ? (keywordData.type.includes('positive') ? 'bg-green-200 dark:bg-green-800 rounded px-1' : 'bg-red-200 dark:bg-red-800 rounded px-1')
                    : '';

                return <span key={i} className={className}>{part}</span>;
            })}
        </p>
    );
};

export default React.memo(HighlightedMessage);
