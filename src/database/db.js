'use server'
// database/db.js
import Database from 'better-sqlite3';
import logger from '@/utils/logger';

const db = new Database(process.env.DB_NAME ?? './database.db');

/**
 * Инициализирует базу данных, создавая необходимые таблицы, если они не существуют.
 */
function initializeDatabase() {
    try {
        // Простая миграция: если существует старая таблица с колонкой 'type', удаляем её
        const tableInfo = db.prepare("PRAGMA table_info(keyword_stats)").all();
        const hasTypeColumn = tableInfo.some(col => col.name === 'type');

        if (hasTypeColumn) {
            logger.log('Detected old schema for keyword_stats. Dropping table to recreate with stat_type_id...');
            db.exec("DROP TABLE keyword_stats");
        }

        const createTableSql = `
            CREATE TABLE IF NOT EXISTS keyword_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stat_type_id INTEGER NOT NULL,
                count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(created_at, stat_type_id)
            );
        `;
        db.exec(createTableSql);

        // Очистка от некорректных данных (если случайно записались строки вместо ID в предыдущей версии)
        const hasBadData = db.prepare("SELECT 1 FROM keyword_stats WHERE typeof(stat_type_id) = 'text' LIMIT 1").get();
        if (hasBadData) {
            logger.log('Cleaning up invalid data (text types) in keyword_stats...');
            db.exec("DELETE FROM keyword_stats WHERE typeof(stat_type_id) = 'text'");
        }
        logger.log('Database initialized: `keyword_stats` table is ready.');
    } catch (error) {
        logger.error('Failed to initialize database:', { error });
        throw error; // Прерываем выполнение, если не удалось инициализировать БД
    }
}

// Запускаем инициализацию при первом импорте этого модуля
initializeDatabase();

// Функция для выполнения запросов (для удобства)
export const query = (sql, params = []) => {
    try {
        const statement = db.prepare(sql);
        return statement.all(params);
    } catch (error) {
        logger.error('DB query error:', { sql, params, error });
        throw error;
    }
};

// Функция для выполнения запросов на вставку/обновление/удаление
export const execute = (sql, params = []) => {
    try {
        const statement = db.prepare(sql);
        const info = statement.run(params);
        return info;
    } catch (error) {
        logger.error('DB execute error:', { sql, params, error });
        throw error;
    }
};

// Функция для получения одной записи
export const getOne = (sql, params = []) => {
    try {
        const statement = db.prepare(sql);
        return statement.get(params);
    } catch (error) {
        logger.error('DB getOne error:', { sql, params, error });
        throw error;
    }
};


export default db;
