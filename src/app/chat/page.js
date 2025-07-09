'use client'

import { useState, useEffect, useCallback } from 'react';
import withRoleAuth from '../components/ProtectedRoute';

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [meta, setMeta] = useState(null);
    const [hours, setHours] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMessages = useCallback(async (isInterval = false) => {
        if (!isInterval) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await fetch(`/api/messages?hours=${hours}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch messages');
            }
            const data = await response.json();
            setMessages(data.messages);
            setMeta(data.meta);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isInterval) {
                setLoading(false);
            }
        }
    }, [hours]);

    // Первоначальная загрузка и загрузка при изменении часов
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Автообновление каждую минуту
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchMessages(true); // Передаем true, чтобы не показывать индикатор загрузки при фоновом обновлении
        }, 60000); // 60 секунд

        return () => clearInterval(intervalId); // Очистка при размонтировании компонента
    }, [fetchMessages]);

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

    return (
        <div className="bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto p-4 flex flex-col h-screen">
                <header className="mb-4 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Сообщения из чата</h1>
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
                                    <div>Отфильтровано: {meta.filteredCount}</div>
                                    <div>Запрос: {meta.processingTimeMs}ms</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="custom-scrollbar flex-1 lg:w-3xl max-w-full overflow-y-auto rounded-lg bg-white p-4 shadow-inner dark:bg-gray-800">
                    {loading && <div className="flex justify-center items-center h-full"><div className="text-gray-500 dark:text-gray-400">Загрузка сообщений...</div></div>}
                    {error && <div className="flex justify-center items-center h-full"><div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-md">Ошибка: {error}</div></div>}

                    {!loading && !error && (
                        <div className="space-y-3">
                            {messages.length > 0 ? (
                                messages.map((msg) => (
                                    <div key={msg.id} className="flex">
                                        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xl">
                                            {msg.replyTo && (
                                                <div className="border-l-2 border-blue-300 dark:border-blue-700 pl-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
                                                    <p className="italic text-left line-clamp-2">{msg.replyTo.message}</p>
                                                </div>
                                            )}
                                            <p className="text-sm text-left text-gray-800 dark:text-gray-200">{msg.message}</p>
                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{msg.date}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-center items-center h-full"><div className="text-center text-gray-500 dark:text-gray-400">За выбранный период нет сообщений.</div></div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default withRoleAuth(ChatPage, ['admin', 'user']);
