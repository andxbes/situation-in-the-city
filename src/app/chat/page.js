'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import withRoleAuth from '../components/ProtectedRoute';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function ChatPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState([]);
    const [isAtBottom, setIsAtBottom] = useState(true);
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
            const response = await fetch(`/api/messages/?hours=${hours}`);
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

    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            if (isAtBottom) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isAtBottom]);

    const handleScroll = useCallback(() => {
        const element = scrollRef.current;
        setIsAtBottom(element.scrollHeight - element.scrollTop === element.clientHeight);
    }, []);
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
    const isAdmin = session?.user?.role === 'admin';

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full rounded-lg">
            <div className="mx-auto p-4 flex flex-col w-full h-screen">
                <header className="mb-4 flex-shrink-0 w-full">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Сообщения из чата</h1>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mt-2 w-full">
                        <div className="flex items-center justify-between gap-4 w-full">
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
                            {isAdmin && <Link className='px-2 py-1 text-sm font-medium text-center text-white bg-green-700 rounded-lg cursor-pointer hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800' href="/filter-editor">R</Link>}
                            {meta && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    <div>Найдено: {meta.totalFound}</div>
                                    <div>Показано: {meta.filteredCount}</div>
                                    <div>Запрос: {meta.processingTimeMs}ms</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="custom-scrollbar w-full flex-1  max-w-full overflow-y-auto rounded-lg bg-white p-4 shadow-inner dark:bg-gray-800"
                >
                    {loading && <div className="flex h-full items-center justify-center"><div className="text-gray-500 dark:text-gray-400">Загрузка сообщений...</div></div>}
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

export default withRoleAuth(ChatPage, ["admin", "user"]);
