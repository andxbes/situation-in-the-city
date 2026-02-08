import db, { query, execute, getOne } from './db';

// Эти ключевые слова будут добавлены в базу данных при первой инициализации.
const INITIAL_KEYWORDS = [
    // Positive Keywords (Emojis and Words)
    ...[
        "🥒",
        "☘",
        "🚓",
        "🚔",
        "🌝",
        "👍",
        "🍆",
        "🥦",
        "✅",
        "🟢",
        "⛔️",
        "☀️",
        "😡",
        "🌼",
        "🫒",
        "🟥",
        "🚨",
        "🛑",
        "🌞",
        "👌",
        "❌",
        "🪀",
        "🌳",
        "👹",
        "💚",
        "🤬",
        "🧶",
        "🌵",
        "🚓",
        "🚧",
        "🐸",
        "👮‍♂",
    ].map((k) => ({ keyword: k, type: "positive", is_regex: 0 })),

    // Positive Words
    ...[
        "грязно",
        "cалатовый",
        "грязь",
        "крепят",
        "крепять",
        "Ямы",
        "Тучи",
        "чисто",
        "чистота",
        "чист",
        "чистый",
        "чизт",
        "тихо",
        "норм",
        "в норме",
        "ок",
        "ok",
        "ухилянт",
        "упаковали",
        "пресуют",
        "пресують",
        "пакуют",
        "катаются",
        "проверка",
        "пешие",
        "внимание",
        "осторожно",
        "черти",
        "гнили",
        "гниль",
    ].map((k) => ({ keyword: k, type: "positive", is_regex: 0 })),

    // Positive Regex
    ...[
        "на[\\s]+военных[\\s]+номерах",
        "воины[\\s]+добра"
    ].map((k) => ({
        keyword: k,
        type: "positive",
        is_regex: 1,
    })),

    // Negative Keywords (Symbols and Words)
    ...[
        "?",
        "¿",
        "съебётся"
    ].map((k) => ({
        keyword: k,
        type: "negative",
        is_regex: 0,
    })),

    // Negative Words
    ...[
        "бля",
        "желательно",
        "а какой",
        "в ахуе",
        "пох",
        "если",
        "чево",
        "чего",
        "шотак",
        "нахуй",
        "блэт",
        "вайб",
        "почему",
        "долбоеб",
        "далбаеб",
        "хуй",
        "пидар",
        "вобщем",
        "меня",
        "долго",
        "знакомого",
        "говорили",
        "мне",
        "заебал",
        "каждому",
        "чувствовал",
        "бежать",
        "для",
        "даже",
        "фильм",
        "актёры",
        "буду[\\s]знать",
        "вариант",
        "развлекайся",
        "перерва",
        "пиво",
        "водка",
        "водки",
        "ты",
        "договор",
        "фух",
    ].map((k) => ({ keyword: k, type: "negative", is_regex: 0 })),

    // Negative Regex
    ...[
        "потому[\\s]что",
        "перед[\\s]тем"
    ].map((k) => ({
        keyword: k,
        type: "negative",
        is_regex: 1,
    })),
];

/**
 * Выполняет миграции для таблицы filter_keywords.
 * Эту функцию можно будет удалить в будущем, когда база данных стабилизируется.
 */
const runFilterKeywordsMigrations = () => {
    let migrationsRun = false;

    // // Миграция: установить stat_type_id = NULL там, где он был равен 3
    // const result = execute("UPDATE filter_keywords SET stat_type_id = NULL WHERE stat_type_id = 3");
    // if (result.changes > 0) {
    //     console.log(`Migration run: ${result.changes} rows updated where stat_type_id was 3.`);
    //     migrationsRun = true;
    // }

    // Если были выполнены миграции, оптимизируем файл базы данных
    if (migrationsRun) {
        console.log("Running database optimization (VACUUM)...");
        execute("VACUUM;");
        console.log("Database optimization complete.");
    }
};

export const initializeFilterKeywordsDatabase = () => {
    execute(`
        CREATE TABLE IF NOT EXISTS keyword_stat_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#cccccc'
        )
    `);

    // Миграция: Добавляем колонку 'color', если она отсутствует
    try {
        const columns = query("PRAGMA table_info(keyword_stat_types)");
        const hasColorColumn = columns.some(col => col.name === 'color');
        if (!hasColorColumn) {
            execute("ALTER TABLE keyword_stat_types ADD COLUMN color TEXT DEFAULT '#cccccc'");
            console.log("Migration run: Added 'color' column to 'keyword_stat_types' table.");
        }
    } catch (e) {
        console.error("Could not run migration for 'keyword_stat_types':", e);
    }

    execute(`
        CREATE TABLE IF NOT EXISTS filter_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL UNIQUE,
            type BOOLEAN NOT NULL CHECK(type IN (0, 1)),
            is_regex BOOLEAN NOT NULL DEFAULT 0,
            stat_type_id INTEGER,
            FOREIGN KEY (stat_type_id) REFERENCES keyword_stat_types(id) ON DELETE SET NULL
        )
    `);

    // Заполняем типы статистики, если их нет
    const statTypeCount = getOne("SELECT COUNT(*) as count FROM keyword_stat_types")?.count;
    if (statTypeCount === 0) {
        const insert = db.prepare("INSERT INTO keyword_stat_types (name, color) VALUES (?, ?)");
        db.transaction((types) => {
            types.forEach(type => insert.run(type.name, type.color));
        })([
            { name: 'blue', color: '#3b82f6' },
            { name: 'green', color: '#22c55e' }
        ]);
    }

    // Запускаем миграции для существующих таблиц
    runFilterKeywordsMigrations();

    const keywordCount = getOne(
        "SELECT COUNT(*) as count FROM filter_keywords"
    )?.count;

    if (keywordCount === 0) {
        console.log("Populating filter_keywords table with initial data...");

        const insert = db.prepare(
            "INSERT INTO filter_keywords (keyword, type, is_regex, stat_type_id) VALUES (?, ?, ?, ?)"
        );

        const insertMany = db.transaction((items) => {
            for (const item of items) {
                try {
                    const isPositive = item.type === 'positive';
                    insert.run(item.keyword, Number(isPositive), Number(item.is_regex), null);
                } catch (error) {
                    // Игнорируем ошибки уникальности, если в исходных данных есть дубликаты
                    if (!error.message.includes("UNIQUE constraint failed")) {
                        console.error(`Failed to insert keyword: ${item.keyword}`, error);
                        throw error;
                    }
                }
            }
        });

        try {
            insertMany(INITIAL_KEYWORDS);
            console.log("filter_keywords table populated successfully.");
        } catch (error) {
            console.error("Error populating filter_keywords table:", error);
        }
    }
};

/**
 * Получает все ключевые слова для фильтрации из базы данных.
 * Эта функция синхронна, так как использует better-sqlite3.
 * @returns {{
 *  positive: Array<{keyword: string, is_regex: number}>,
 *  negative: Array<{keyword: string, is_regex: number}>
 * }} Объект с ключевыми словами, сгруппированными по типу.
 */
export const getFilterKeywords = () => {
    // Преобразуем 1/0 обратно в 'positive'/'negative' для обратной совместимости с остальной логикой
    const rows = query(
        "SELECT keyword, CASE type WHEN 1 THEN 'positive' ELSE 'negative' END as type, is_regex FROM filter_keywords"
    );

    const keywords = {
        positive: [],
        negative: [],
    };

    for (const row of rows) {
        switch (row.type) {
            case "positive":
                keywords.positive.push({
                    keyword: row.keyword,
                    is_regex: row.is_regex,
                });
                break;
            case "negative":
                keywords.negative.push({
                    keyword: row.keyword,
                    is_regex: row.is_regex,
                });
                break;
        }
    }
    return keywords;
};

/**
 * Получает все ключевые слова в виде массива объектов.
 * @returns {Array<Object>}
 */
export const getAllFilterKeywords = () => {
    return query(
        `SELECT
            kw.id,
            kw.keyword,
            CASE kw.type WHEN 1 THEN 'positive' ELSE 'negative' END as type,
            kw.is_regex,
            kw.stat_type_id,
            kst.name as stat_type_name
         FROM filter_keywords kw
         LEFT JOIN keyword_stat_types kst ON kw.stat_type_id = kst.id
         ORDER BY kw.type, kw.keyword`
    );
};

/**
 * Получает все ключевые слова, у которых задан тип статистики.
 * @returns {Array<Object>}
 */
export const getStatKeywords = () => {
    return query(
        `SELECT
            kw.keyword,
            kw.is_regex,
            kst.name as stat_type_name,
            kst.id as stat_type_id
         FROM filter_keywords kw
         JOIN keyword_stat_types kst ON kw.stat_type_id = kst.id
         WHERE kw.stat_type_id IS NOT NULL`
    );
};

/**
 * Получает все типы статистики для ключевых слов.
 * @returns {Array<{id: number, name: string}>}
 */
export const getKeywordStatTypes = () => {
    return query("SELECT id, name, color FROM keyword_stat_types ORDER BY name");
};

/**
 * Добавляет новый тип статистики для ключевых слов.
 * @param {string} name
 * @returns {import('better-sqlite3').RunResult}
 */
export const addKeywordStatType = (name, color) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error("Stat type name is required and must be a non-empty string.");
    }
    try {
        return execute(
            "INSERT INTO keyword_stat_types (name, color) VALUES (?, ?)",
            [name.trim(), color]
        );
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            const err = new Error(`Stat type "${name}" already exists.`);
            err.code = "SQLITE_CONSTRAINT_UNIQUE";
            throw err;
        }
        throw error;
    }
};

/**
 * Обновляет существующий тип статистики.
 * @param {{id: number, name: string}} data
 * @returns {import('better-sqlite3').RunResult}
 */
export const updateKeywordStatType = ({ id, name, color }) => {
    if (!id || !name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error("ID and a non-empty name are required for update.");
    }
    try {
        return execute(
            "UPDATE keyword_stat_types SET name = ?, color = ? WHERE id = ?",
            [name.trim(), color, id]
        );
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            const err = new Error(`Stat type "${name}" already exists.`);
            err.code = "SQLITE_CONSTRAINT_UNIQUE";
            throw err;
        }
        throw error;
    }
};

export const deleteKeywordStatType = (id) => {
    if (!id) throw new Error("ID is required to delete a stat type.");
    return execute("DELETE FROM keyword_stat_types WHERE id = ?", [id]);
};
/**
 * Добавляет новое ключевое слово в базу данных.
 * @param {{keyword: string, type: string, is_regex: number}} data
 * @returns {import('better-sqlite3').RunResult}
 */
export const addFilterKeyword = ({ keyword, type, is_regex = 0, stat_type_id = null }) => {
    if (!keyword || !type) {
        throw new Error("Keyword and type are required.");
    }
    const isPositiveType = type === 'positive';

    try {
        return execute(
            "INSERT INTO filter_keywords (keyword, type, is_regex, stat_type_id) VALUES (?, ?, ?, ?)",
            [keyword.trim(), Number(isPositiveType), is_regex, stat_type_id]
        );
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            const err = new Error(`Keyword "${keyword}" already exists.`);
            err.code = "SQLITE_CONSTRAINT_UNIQUE";
            throw err;
        }
        throw error;
    }
};

export const deleteFilterKeyword = (id) => {
    if (!id) throw new Error("ID is required to delete a keyword.");
    return execute("DELETE FROM filter_keywords WHERE id = ?", [id]);
};

/**
 * Обновляет существующее ключевое слово.
 * @param {{id: number, keyword: string, type: string, is_regex: number, stat_type_id: number | null}} data
 * @returns {import('better-sqlite3').RunResult}
 */
export const updateFilterKeyword = ({ id, keyword, type, is_regex, stat_type_id }) => {
    if (!id || !keyword || !type) {
        throw new Error("ID, keyword, and type are required for update.");
    }
    const isPositiveType = type === 'positive';

    try {
        return execute(
            "UPDATE filter_keywords SET keyword = ?, type = ?, is_regex = ?, stat_type_id = ? WHERE id = ?",
            [keyword.trim(), Number(isPositiveType), is_regex, stat_type_id, id]
        );
    } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
            const err = new Error(`Keyword "${keyword}" already exists.`);
            err.code = "SQLITE_CONSTRAINT_UNIQUE";
            throw err;
        }
        throw error;
    }
};


// Инициализируем таблицу с ключевыми словами для фильтрации
initializeFilterKeywordsDatabase();
