import db, { query, execute, getOne } from "./db";

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
    ...["потому[\\s]что", "перед[\\s]тем"].map((k) => ({
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
    // Проверяем, существует ли таблица, чтобы избежать ошибок на первой инициализации
    const tableExists = getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='filter_keywords'");
    if (!tableExists) {
        return; // Миграции не нужны, если таблицы еще нет
    }

    const columns = query("PRAGMA table_info(filter_keywords)");

    // Миграция 1: Изменение типа колонки 'type' с TEXT на BOOLEAN
    const typeColumn = columns.find(col => col.name === 'type');
    if (typeColumn && typeColumn.type === 'TEXT') {
        console.log("Migrating 'filter_keywords.type' column from TEXT to BOOLEAN...");
        db.transaction(() => {
            execute("ALTER TABLE filter_keywords RENAME TO filter_keywords_old");
            execute(`
                CREATE TABLE filter_keywords (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    keyword TEXT NOT NULL UNIQUE,
                    type BOOLEAN NOT NULL CHECK(type IN (0, 1)),
                    is_regex BOOLEAN NOT NULL DEFAULT 0,
                    stat_type_id INTEGER,
                    FOREIGN KEY (stat_type_id) REFERENCES keyword_stat_types(id) ON DELETE SET NULL
                )
            `);
            execute("INSERT INTO filter_keywords (id, keyword, type, is_regex, stat_type_id) SELECT id, keyword, CASE WHEN type = 'positive' THEN 1 ELSE 0 END, is_regex, stat_type_id FROM filter_keywords_old");
            execute("DROP TABLE filter_keywords_old");
        })();
        console.log("'type' column migrated successfully.");
    }

    // Миграция 2: Добавление колонки 'stat_type_id'
    const hasStatTypeIdColumn = columns.some(col => col.name === 'stat_type_id');
    if (!hasStatTypeIdColumn) {
        console.log("Adding 'stat_type_id' column to 'filter_keywords' table...");
        execute('ALTER TABLE filter_keywords ADD COLUMN stat_type_id INTEGER REFERENCES keyword_stat_types(id) ON DELETE SET NULL');
        const alertTypeId = getOne("SELECT id FROM keyword_stat_types WHERE name = 'alert'")?.id;
        execute("UPDATE filter_keywords SET stat_type_id = ? WHERE type = 1", [alertTypeId]);
        console.log("Column 'stat_type_id' added and populated for positive keywords.");
    }
};

export const initializeFilterKeywordsDatabase = () => {
    execute(`
        CREATE TABLE IF NOT EXISTS keyword_stat_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

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
        const insert = db.prepare("INSERT INTO keyword_stat_types (name) VALUES (?)");
        db.transaction((types) => {
            types.forEach(type => insert.run(type));
        })(['blue', 'green', 'alert']);
    }

    // Запускаем миграции для существующих таблиц
    runFilterKeywordsMigrations();

    const keywordCount = getOne(
        "SELECT COUNT(*) as count FROM filter_keywords"
    )?.count;

    if (keywordCount === 0) {
        console.log("Populating filter_keywords table with initial data...");

        const alertTypeId = getOne("SELECT id FROM keyword_stat_types WHERE name = 'alert'")?.id;

        const insert = db.prepare(
            "INSERT INTO filter_keywords (keyword, type, is_regex, stat_type_id) VALUES (?, ?, ?, ?)"
        );

        const insertMany = db.transaction((items) => {
            for (const item of items) {
                try {
                    const isPositive = item.type === 'positive';
                    const stat_type_id = isPositive ? alertTypeId : null;
                    insert.run(item.keyword, Number(isPositive), Number(item.is_regex), stat_type_id);
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
        "SELECT id, keyword, CASE type WHEN 1 THEN 'positive' ELSE 'negative' END as type, is_regex, stat_type_id FROM filter_keywords ORDER BY type, keyword"
    );
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
    const isPositive = type === 'positive';
    try {
        return execute(
            "INSERT INTO filter_keywords (keyword, type, is_regex, stat_type_id) VALUES (?, ?, ?, ?)",
            [keyword.trim(), Number(isPositive), is_regex, stat_type_id]
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


// Инициализируем таблицу с ключевыми словами для фильтрации
initializeFilterKeywordsDatabase();
