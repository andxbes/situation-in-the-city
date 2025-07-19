'use client';
import React, { useMemo } from 'react';

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const HighlightedMessage = ({ text, keywords }) => {
    const { regex, keywordsMap } = useMemo(() => {
        if (!keywords || keywords.length === 0) {
            return { regex: null, keywordsMap: new Map() };
        }

        const map = new Map();
        const escapedKeywords = keywords.map(kw => {
            map.set(kw.keyword.toLowerCase(), kw);
            return escapeRegex(kw.keyword);
        });

        // Используем \b для поиска целых слов, чтобы не подсвечивать части слов
        const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
        return { regex, keywordsMap: map };
    }, [keywords]);

    if (!regex || !text) {
        return <p className="text-sm text-left text-gray-800 dark:text-gray-200">{text}</p>;
    }

    const parts = text.split(regex);

    return (
        <p className="text-sm text-left text-gray-800 dark:text-gray-200">
            {parts.map((part, i) => {
                const keywordData = keywordsMap.get(part.toLowerCase());
                const className = keywordData ? (keywordData.type.includes('positive') ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800') : '';
                return <span key={i} className={className}>{part}</span>;
            })}
        </p>
    );
};

export default React.memo(HighlightedMessage);
