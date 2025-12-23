import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getStatKeywords } from '@/database/filterKeywords';
import { calculateKeywordStats } from '@/utils/stats';
import { getMessagesForPeriod } from '@/tg/tclient';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    // Доступ к статистике разрешен для всех авторизованных пользователей
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            // Получаем ключевые слова, которые используются для статистики
            const statKeywords = getStatKeywords();
            if (statKeywords.length === 0) {
                return res.status(200).json({ hourly: Array.from({ length: 24 }, () => ({})), daily: {} });
            }

            // Определяем время, за которое нужно получить сообщения (последние 24 часа)
            const fromTime = Math.floor(Date.now() / 1000) - (24 * 3600);

            // Получаем сообщения
            const rawMessages = await getMessagesForPeriod(fromTime);

            // Форматируем сообщения для функции подсчета статистики.
            // msg.date - это timestamp в секундах, преобразуем его в объект Date.
            const messages = rawMessages.map(msg => ({
                message: msg.message,
                date: new Date(msg.date * 1000),
            }));

            // Рассчитываем статистику
            const stats = calculateKeywordStats(messages, statKeywords);

            return res.status(200).json(stats);
        } catch (error) {
            console.error('API Error fetching keyword stats:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
