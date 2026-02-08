export async function register() {
    // Убеждаемся, что код выполняется в среде Node.js (а не в Edge или браузере),
    // так как работа с базой данных (sqlite) и таймерами нужна на сервере.
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Динамический импорт, чтобы избежать проблем с загрузкой модулей на этапе сборки
        const { startScheduler } = await import('@/database/statsScheduler');

        console.log('[Instrumentation] Registering stats scheduler...');
        startScheduler();
    }
}
