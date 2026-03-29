import { execute, query } from './db';

/**
 * Сохраняет статистику за час в базу данных.
 * @param {Object} stats - Объект вида { '1': 10, '2': 5 } (где ключи - stat_type_id)
 * @param {Date} date - Время фиксации (обычно начало часа)
 */
export async function saveHourlyStats(stats, date) {
    const sql = `
            INSERT INTO keyword_stats (stat_type_id, count, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(created_at, stat_type_id) DO UPDATE SET count = excluded.count
        `;

    Object.entries(stats).forEach(([type, count]) => {
        execute(sql, [type, count, date.toISOString()]);
    });
}

/**
 * Получает статистику за указанную дату.
 * @param {string} dateStr - Дата в формате 'YYYY-MM-DD'
 * @returns {Promise<{hourly: Array, daily: Object}>}
 */
export async function getStatsForDate(dateStr) {
    // Пример SQL: выбрать все записи за конкретный день
    const sql = `
        SELECT stat_type_id, count, created_at 
        FROM keyword_stats 
        WHERE DATE(created_at, 'localtime') = ?
        ORDER BY created_at ASC
    `;
    const rows = query(sql, [dateStr]);

    // Формируем структуру, которую ожидает фронтенд
    const hourly = Array.from({ length: 24 }, () => ({}));
    const daily = {};

    rows.forEach(row => {
        const d = new Date(row.created_at);
        const hour = d.getHours(); // Используем локальное время сервера
        const type = row.stat_type_id;
        const count = row.count;

        // Заполняем почасовую статистику
        if (hourly[hour]) {
            hourly[hour][type] = (hourly[hour][type] || 0) + count;
        }

        // Заполняем общую статистику за день
        daily[type] = (daily[type] || 0) + count;
    });

    return { hourly, daily };
}

/**
 * Получает агрегированную статистику по дням за указанный период.
 * @param {string} start - Дата начала в формате 'YYYY-MM-DD'
 * @param {string} end - Дата окончания в формате 'YYYY-MM-DD'
 */
export async function getStatsForRange(start, end) {
    const sql = `
        SELECT stat_type_id, SUM(count) as total, DATE(created_at, 'localtime') as day
        FROM keyword_stats 
        WHERE DATE(created_at, 'localtime') BETWEEN ? AND ?
        GROUP BY day, stat_type_id
        ORDER BY day ASC
    `;
    return query(sql, [start, end]);
}
