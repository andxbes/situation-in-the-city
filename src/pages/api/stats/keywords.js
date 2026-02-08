import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getStatKeywords, getKeywordStatTypes } from '@/database/filterKeywords';
import { getformatDateTime } from '@/utils/utils';
import { getStatsForDate } from '@/database/stats';
import { calculateKeywordStats } from '@/utils/stats';
import { getMessagesForPeriod } from '@/tg/tclient';

export default async function handler(req, res) {
    // const session = await getServerSession(req, res, authOptions);

    // // Доступ к статистике разрешен для всех авторизованных пользователей
    // if (!session) {
    //     return res.status(401).json({ message: 'Unauthorized' });
    // }

    if (req.method === 'GET') {
        try {
            // Получаем дату из запроса или используем текущую
            const { date } = req.query;
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            let targetDate = date;
            if (!targetDate) {
                targetDate = todayStr;
            }

            // Получаем ключевые слова, которые используются для статистики
            const statKeywords = getStatKeywords();
            if (!statKeywords || statKeywords.length === 0) {
                return res.status(200).json({ hourly: Array.from({ length: 24 }, () => ({})), daily: {} });
            }

            // Получаем статистику из базы данных
            const stats = await getStatsForDate(targetDate);

            // Если запрашивается статистика за сегодня, добавляем данные за текущий (неполный) час в реальном времени
            if (targetDate === todayStr) {
                const currentHour = now.getHours();
                const startOfCurrentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0, 0);
                const fromTime = Math.floor(startOfCurrentHour.getTime() / 1000);

                // Получаем сообщения за текущий час
                const rawMessages = await getMessagesForPeriod(fromTime);
                const messages = rawMessages.map(msg => ({
                    message: msg.message,
                    date: new Date(msg.date * 1000),
                }));

                const currentStats = calculateKeywordStats(messages, statKeywords);

                // Добавляем статистику текущего часа в массив (перезаписываем, если там пусто)
                stats.hourly[currentHour] = currentStats.daily;

                // Обновляем общие счетчики за день
                Object.entries(currentStats.daily).forEach(([type, count]) => {
                    stats.daily[type] = (stats.daily[type] || 0) + count;
                });
            }

            const dateNowFormat = `${targetDate}`;

            // Получаем метаданные для типов статистики (цвета)
            const statTypesMeta = getKeywordStatTypes();

            // Возвращаем всё в одном ответе
            return res.status(200).json({ ...stats, meta: { statTypes: statTypesMeta, dateNowFormat } });

        } catch (error) {
            console.error('API Error fetching keyword stats:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
