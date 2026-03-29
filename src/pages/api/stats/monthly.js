import { getKeywordStatTypes } from '@/database/filterKeywords';
import { getStatsForRange } from '@/database/stats';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { year, month } = req.query;
        let startDateStr, endDateStr;

        if (year && month) {
            const y = parseInt(year);
            const m = parseInt(month);
            // Формируем диапазон с 1-го числа по последнее число месяца
            startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        } else {
            // По умолчанию: статистика за последние 30 дней
            const now = new Date();
            endDateStr = now.toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setDate(now.getDate() - 30);
            startDateStr = startDate.toISOString().split('T')[0];
        }

        const rows = await getStatsForRange(startDateStr, endDateStr);

        // Группируем данные по дням для графика (Recharts ожидает массив объектов с ключами-значениями)
        const grouped = rows.reduce((acc, row) => {
            if (!acc[row.day]) {
                acc[row.day] = { day: row.day };
            }
            acc[row.day][row.stat_type_id] = row.total;
            return acc;
        }, {});

        const chartData = Object.values(grouped);
        const statTypesMeta = getKeywordStatTypes();

        return res.status(200).json({
            data: chartData,
            meta: { statTypes: statTypesMeta }
        });

    } catch (error) {
        console.error('API Error fetching monthly stats:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
