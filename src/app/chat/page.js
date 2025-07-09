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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Сообщения из чата</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <label htmlFor="hours-slider" className="block text-lg font-medium text-gray-700">
                    Период: {hours} {hours === 1 ? 'час' : (hours > 1 && hours < 5) ? 'часа' : 'часов'}
                </label>
                <input
                    id="hours-slider"
                    type="range"
                    min="1"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>

            {loading && <div className="text-center text-gray-500">Загрузка сообщений...</div>}
            {error && <div className="text-center text-red-500 bg-red-100 p-3 rounded-md">Ошибка: {error}</div>}

            {!loading && !error && (
                <>
                    {meta && (
                        <div className="text-sm text-gray-500 mb-4">
                            Найдено: {meta.totalFound}, отфильтровано: {meta.filteredCount}. (Запрос занял: {meta.processingTimeMs}ms)
                        </div>
                    )}
                    <div className="space-y-4">
                        {messages.length > 0 ? (
                            messages.map((msg) => (
                                <div key={msg.id} className="bg-white p-4 rounded-lg shadow">
                                    {msg.replyTo && (
                                        <blockquote className="border-l-4 border-gray-300 pl-4 mb-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <p className="italic">"{msg.replyTo.message}"</p>
                                            <footer className="text-right text-xs text-gray-400 mt-1">- {msg.replyTo.date}</footer>
                                        </blockquote>
                                    )}
                                    <p className="text-gray-800">{msg.message}</p>
                                    <div className="text-right text-xs text-gray-500 mt-2">{msg.date}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500">За выбранный период нет сообщений.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default withRoleAuth(ChatPage, ['admin', 'user']);
