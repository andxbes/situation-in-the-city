'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import withRoleAuth from '../components/ProtectedRoute';
import HighlightedMessage from '../components/filter-editor/HighlightedMessage';
import SelectionMenu from '../components/filter-editor/SelectionMenu';

function getHourWord(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'часов';
    }
    if (lastDigit === 1) {
        return 'час';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'часа';
    }
    return 'часов';
}

function FilterEditorPage() {
    const [messages, setMessages] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [meta, setMeta] = useState(null);
    const [hours, setHours] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selection, setSelection] = useState({ show: false, text: '', x: 0, y: 0 });

    const mainContainerRef = useRef(null);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/messages/all?hours=${hours}`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            const data = await response.json();
            setMessages(data.messages);
            setMeta(data.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [hours]);

    const fetchKeywords = useCallback(async () => {
        try {
            const response = await fetch('/api/filters/keywords');
            if (!response.ok) throw new Error('Failed to fetch keywords');
            const data = await response.json();
            setKeywords(data);
        } catch (err) {
            setError(p => p ? `${p}, ${err.message}` : err.message);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        fetchKeywords();
    }, [fetchKeywords]);

    const handleMouseUp = (e) => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            setSelection({
                show: true,
                text: selectedText,
                x: e.pageX,
                y: e.pageY,
            });
        } else {
            if (!e.target.closest('.dark\\:bg-gray-700')) {
                setSelection({ show: false, text: '', x: 0, y: 0 });
            }
        }
    };

    const handleAddKeyword = async (text, type) => {
        try {
            const response = await fetch('/api/filters/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: text, type, is_regex: 0 }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to add keyword');
            }
            await fetchKeywords(); // Re-fetch keywords to update highlighting
            setSelection({ show: false, text: '', x: 0, y: 0 });
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteKeyword = async (id) => {
        if (confirm('Are you sure you want to delete this keyword?')) {
            try {
                const response = await fetch(`/api/filters/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete keyword');
                await fetchKeywords();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900" onMouseUp={handleMouseUp}>
            <SelectionMenu selection={selection} onAddKeyword={handleAddKeyword} onClose={() => setSelection({ show: false })} />
            <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 lg:h-screen">
                {/* Messages Column */}
                <div className="flex-grow lg:w-2/3 flex flex-col">
                    <header className="mb-4 flex-shrink-0">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Редактор фильтров</h1>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mt-2">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <label htmlFor="hours-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Период: {hours} {getHourWord(hours)}
                                    </label>
                                    <input
                                        id="hours-slider"
                                        type="range"
                                        min="1"
                                        max="24"
                                        value={hours}
                                        onChange={(e) => setHours(Number(e.target.value))}
                                        className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                </div>
                                {meta && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                        <div>Найдено: {meta.totalFound}</div>
                                        <div>Запрос: {meta.processingTimeMs}ms</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                    <main ref={mainContainerRef} className="custom-scrollbar flex-1 overflow-y-auto rounded-lg bg-white p-4 shadow-inner dark:bg-gray-800">
                        {loading && <div className="text-center">Загрузка...</div>}
                        {error && <div className="text-center text-red-500">Ошибка: {error}</div>}
                        {!loading && !error && (
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex">
                                        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xl">
                                            {msg.replyTo && (
                                                <div className="border-l-2 border-blue-300 dark:border-blue-700 pl-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
                                                    <p className="italic text-left line-clamp-2">{msg.replyTo.message}</p>
                                                </div>
                                            )}
                                            <HighlightedMessage text={msg.message} keywords={keywords} />
                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{msg.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>

                {/* Keywords Column */}
                <div className="flex-shrink-0 lg:w-[40%] flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ключевые слова</h2>
                    <div className="custom-scrollbar flex-1 overflow-y-auto rounded-lg bg-white p-4 shadow-inner dark:bg-gray-800">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-2 py-2 w-12 text-center">Удал.</th>
                                    <th scope="col" className="px-4 py-2">Ключевое слово</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.map(kw => (
                                    <tr key={kw.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-2 py-2 text-center align-middle">
                                            <button
                                                onClick={() => handleDeleteKeyword(kw.id)}
                                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title="Удалить ключевое слово"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                        <td className="px-2 py-2 align-middle">
                                            <span
                                                className={`px-3 py-1 text-sm font-mono rounded-full w-full inline-block ${kw.type === 'positive'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}
                                                title={`Тип: ${kw.type}${kw.is_regex ? ' (Регулярное выражение)' : ''}`}
                                            >
                                                {kw.keyword}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withRoleAuth(FilterEditorPage, ["admin"]);
