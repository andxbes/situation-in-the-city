import { getStatKeywords } from '@/database/filterKeywords';
import { calculateKeywordStats } from '@/utils/stats';
import { getMessagesForPeriod } from '@/tg/tclient';
import { saveHourlyStats, getStatsForDate } from '@/database/stats';

async function processHourStats(startOfHour) {
    try {
        const endOfHour = new Date(startOfHour.getTime() + 60 * 60 * 1000);

        const fromTime = Math.floor(startOfHour.getTime() / 1000);

        // Получаем сообщения
        const rawMessages = await getMessagesForPeriod(fromTime);

        // Фильтруем точно за час
        const messages = rawMessages
            .map(msg => ({ message: msg.message, date: new Date(msg.date * 1000) }))
            .filter(msg => msg.date >= startOfHour && msg.date < endOfHour);

        // Считаем
        const statKeywords = getStatKeywords();
        const statsFull = calculateKeywordStats(messages, statKeywords);
        const statsForHour = statsFull.daily || {};

        // Сохраняем
        await saveHourlyStats(statsForHour, startOfHour);
        console.log(`[Scheduler] Saved stats for ${startOfHour.toISOString()}`);
    } catch (error) {
        console.error(`[Scheduler] Error processing ${startOfHour.toISOString()}:`, error);
    }
}

async function runHourlyStats() {
    console.log('[Scheduler] Starting hourly stats aggregation...');
    const now = new Date();
    // Определяем предыдущий час (за который считаем статистику), используя локальное время
    const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    const startOfHour = new Date(endOfHour.getTime() - 60 * 60 * 1000);

    await processHourStats(startOfHour);
}

async function checkAndFillDailyStats() {
    try {
        const now = new Date();
        // Формируем дату в формате YYYY-MM-DD по локальному времени
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const stats = await getStatsForDate(dateStr);

        const currentHour = now.getHours();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        console.log(`[Scheduler] Checking for missing stats for ${dateStr} (00:00 - ${currentHour}:00)...`);

        for (let i = 0; i < currentHour; i++) {
            // Проверяем, есть ли данные за этот час.
            // Если объект пустой, значит статистика не была сохранена (или была сохранена пустой, если ключевых слов нет, но мы предполагаем, что они есть).
            const hasData = stats.hourly[i] && Object.keys(stats.hourly[i]).length > 0;

            if (!hasData) {
                console.log(`[Scheduler] Missing stats for hour ${i}:00. Backfilling...`);
                const hourTime = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
                await processHourStats(hourTime);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Backfill error:', error);
    }
}

// Используем глобальную переменную для хранения состояния планировщика,
// чтобы он не перезапускался при Hot Module Replacement (HMR) в dev-режиме.
const globalForScheduler = global;

export function startScheduler() {
    if (globalForScheduler.schedulerStarted) return;
    globalForScheduler.schedulerStarted = true;

    const now = new Date();
    // Вычисляем время до следующего часа
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const delay = nextHour.getTime() - now.getTime();

    console.log(`[Scheduler] Initialized. First run in ${Math.round(delay / 1000)} seconds.`);

    // Проверяем пропущенную статистику при запуске
    checkAndFillDailyStats();

    // Первый запуск через delay (в начале следующего часа)
    setTimeout(() => {
        runHourlyStats();
        // Последующие запуски каждый час
        setInterval(runHourlyStats, 60 * 60 * 1000);
    }, delay);
}
