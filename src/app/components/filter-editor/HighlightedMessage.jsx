'use client';
import React, { useMemo } from 'react';

function escapeRegex(string) {
    // Escape characters with special meaning in regular expressions.
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// A check to see if a keyword should be treated as a "whole word".
// This is true for strings containing only Unicode letters, numbers, and spaces.
// Emojis, punctuation, etc., will return false and won't be wrapped in word boundaries.
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

        // Sort by length descending to match longer words first (e.g., "люстры" before "люстра")
        const sortedKeywords = [...keywords].sort((a, b) => {
            if (a.is_regex || b.is_regex) return 0; // Don't sort regexes relative to other types
            return b.keyword.length - a.keyword.length;
        });

        for (const kw of sortedKeywords) {
            map.set(kw.keyword.toLowerCase(), kw);

            if (kw.is_regex) {
                parts.regex.push(kw.keyword);
            } else if (isWordLike(kw.keyword)) {
                parts.word.push(escapeRegex(kw.keyword));
            } else {
                parts.symbol.push(escapeRegex(kw.keyword));
            }
        }

        const finalRegexParts = [];

        // Each part of the regex will be a capturing group.
        // This is so `split` can return the matched keyword.
        // When one group matches, the others will be `undefined` in the `split` result.

        if (parts.regex.length > 0) {
            finalRegexParts.push(...parts.regex.map(r => `(${r})`));
        }

        if (parts.word.length > 0) {
            const wordGroup = parts.word.join('|');
            // Use Unicode-aware "word boundaries" via lookarounds because `\b` fails for Cyrillic.
            // `(?<=^|[^\p{L}\p{N}])` = preceded by start of string or a non-letter/non-number.
            // `(?=[^\p{L}\p{N}]|$)` = followed by a non-letter/non-number or end of string.
            finalRegexParts.push(`(?<=^|[^\\p{L}\\p{N}])(${wordGroup})(?=[^\\p{L}\\p{N}]|$)`);
        }

        if (parts.symbol.length > 0) {
            finalRegexParts.push(`(${parts.symbol.join('|')})`);
        }

        if (finalRegexParts.length === 0) {
            return { regex: null, keywordsMap: new Map() };
        }

        const regex = new RegExp(finalRegexParts.join('|'), 'giu');
        return { regex, keywordsMap: map };
    }, [keywords]);

    if (!regex || !text) {
        return <p className="text-sm text-left text-gray-800 dark:text-gray-200">{text}</p>;
    }

    // `split` with a regex containing multiple top-level capture groups
    // will interleave non-matches with matches and `undefined`s for non-matching groups.
    const parts = text.split(regex);

    return (
        <p className="text-sm text-left text-gray-800 dark:text-gray-200" style={{ whiteSpace: 'pre-wrap' }}>
            {parts.map((part, i) => {
                // A part can be `undefined` if it's from a capturing group that didn't match.
                if (part === undefined) return null;

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
