'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import withRoleAuth from '../components/ProtectedRoute';
import HighlightedMessage from '../components/filter-editor/HighlightedMessage';
import SelectionMenu from '../components/filter-editor/SelectionMenu';

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
        fetchKeywords();
    }, [fetchMessages, fetchKeywords]);

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
            <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 h-screen">
                {/* Messages Column */}
                <div className="flex-grow lg:w-2/3 flex flex-col">
                    <header className="mb-4 flex-shrink-0">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Редактор фильтров</h1>
                        {/* ... controls ... */}
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
                <div className="flex-shrink-0 lg:w-1/3 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ключевые слова</h2>
                    <div className="custom-scrollbar flex-1 overflow-y-auto rounded-lg bg-white p-4 shadow-inner dark:bg-gray-800">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-4 py-2">Слово</th>
                                    <th scope="col" className="px-4 py-2">Тип</th>
                                    <th scope="col" className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.map(kw => (
                                    <tr key={kw.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{kw.keyword}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${kw.type.includes('positive') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                                {kw.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => handleDeleteKeyword(kw.id)} className="text-red-500 hover:text-red-700">
                                                &#x2715;
                                            </button>
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
