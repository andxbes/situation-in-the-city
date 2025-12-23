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
    // Инициализируем структуру для хранения статистики
    const hourlyStats = Array.from({ length: 24 }, () => ({}));
    const dailyStats = {};

    // Получаем уникальные типы статистики (например, 'blue', 'green')
    const statTypes = [...new Set(statKeywords.map(kw => kw.stat_type_name))];

    // Инициализируем счетчики для каждого типа статистики
    statTypes.forEach(type => {
        dailyStats[type] = 0;
        hourlyStats.forEach(hourStat => {
            hourStat[type] = 0;
        });
    });

    // Обрабатываем каждое сообщение
    for (const message of messages) {
        // Используем Set, чтобы считать каждое сообщение с определенным типом статистики только один раз
        const foundStatTypesForMessage = new Set();

        // Проверяем наличие каждого ключевого слова в сообщении
        for (const keyword of statKeywords) {
            // Пропускаем, если этот тип статистики уже был найден в данном сообщении
            if (foundStatTypesForMessage.has(keyword.stat_type_name)) {
                continue;
            }

            const pattern = keyword.is_regex ? keyword.keyword : escapeRegExp(keyword.keyword);

            // Создаем регулярное выражение для поиска (без учета регистра)
            // Оборачиваем в try-catch на случай невалидного регулярного выражения из БД
            try {
                const regex = new RegExp(pattern, 'i');

                if (regex.test(message.message)) {
                    foundStatTypesForMessage.add(keyword.stat_type_name);
                }
            } catch (e) {
                console.error(`Invalid regex pattern for keyword "${keyword.keyword}":`, e);
            }
        }

        // Если в сообщении найдены статистические ключевые слова, обновляем счетчики
        if (foundStatTypesForMessage.size > 0) {
            const hour = message.date.getHours();

            foundStatTypesForMessage.forEach(statType => {
                hourlyStats[hour][statType]++; // hourlyStats[hour] уже инициализирован
                dailyStats[statType]++;
            });
        }
    }

    return { hourly: hourlyStats, daily: dailyStats };
}
