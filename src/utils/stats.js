/**
 * Рассчитывает статистику по ключевым словам на основе предоставленных сообщений.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
/**
 * Рассчитывает статистику по ключевым словам на основе предоставленных сообщений.
 *
 * @param {Array<Object>} messages - Массив объектов сообщений. У каждого сообщения должно быть свойство `message` (string) и `date` (string).
 * @param {Array<Object>} statKeywords - Массив ключевых слов для статистики. Каждое слово должно иметь `keyword`, `is_regex` и `stat_type_name`.
 * @returns {{hourly: Object, daily: Object}} - Объект со статистикой по часам и за весь день.
 */
export function calculateKeywordStats(messages, statKeywords) {
    // Получаем уникальные типы статистики (например, 'blue', 'green')
    const statTypes = [...new Set(statKeywords.map(kw => kw.stat_type_name))];

    // 1. Инициализация
    const initialCounters = {};
    statTypes.forEach(type => (initialCounters[type] = 0));
    const hourlyStats = Array.from({ length: 24 }, () => ({ ...initialCounters }));
    const dailyStats = { ...initialCounters };

    // 2. Оптимизация: Группируем ключевые слова по типу статистики и создаем одно большое регулярное выражение
    const statTypeRegexMap = new Map();
    for (const type of statTypes) {
        const patterns = statKeywords
            .filter(kw => kw.stat_type_name === type)
            .map(kw => (kw.is_regex ? kw.keyword : escapeRegExp(kw.keyword)));

        if (patterns.length > 0) {
            // Создаем одно большое регулярное выражение для каждого типа
            const combinedRegex = new RegExp(patterns.join('|'), 'i');
            statTypeRegexMap.set(type, combinedRegex);
        }
    }

    // Обрабатываем каждое сообщение
    for (const message of messages) {
        if (!message.message) continue;

        let messageHasMatches = false;
        const hour = message.date.getHours();

        // 3. Оптимизация: Проверяем каждое сообщение только один раз для каждого типа статистики
        for (const [statType, regex] of statTypeRegexMap.entries()) {
            if (regex.test(message.message)) {
                hourlyStats[hour][statType]++;
                messageHasMatches = true;
            }
        }

        // Обновляем дневную статистику, если было хотя бы одно совпадение в сообщении
        if (messageHasMatches) {
            for (const [statType, regex] of statTypeRegexMap.entries()) {
                if (regex.test(message.message)) {
                    dailyStats[statType]++;
                }
            }
        }
    }

    return { hourly: hourlyStats, daily: dailyStats };
}
