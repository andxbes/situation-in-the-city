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

export const initializeFilterKeywordsDatabase = () => {
    execute(`
        CREATE TABLE IF NOT EXISTS filter_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL CHECK(type IN ('positive', 'negative')),
            is_regex BOOLEAN NOT NULL DEFAULT 0
        )
    `);

    const keywordCount = getOne(
        "SELECT COUNT(*) as count FROM filter_keywords"
    )?.count;

    if (keywordCount === 0) {
        console.log("Populating filter_keywords table with initial data...");

        const insert = db.prepare(
            "INSERT INTO filter_keywords (keyword, type, is_regex) VALUES (?, ?, ?)"
        );

        const insertMany = db.transaction((items) => {
            for (const item of items) {
                try {
                    insert.run(item.keyword, item.type, Number(item.is_regex));
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
    const rows = query("SELECT keyword, type, is_regex FROM filter_keywords");

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
    return query("SELECT * FROM filter_keywords ORDER BY type, keyword");
};

/**
 * Добавляет новое ключевое слово в базу данных.
 * @param {{keyword: string, type: string, is_regex: number}} data
 * @returns {import('better-sqlite3').RunResult}
 */
export const addFilterKeyword = ({ keyword, type, is_regex = 0 }) => {
    if (!keyword || !type) {
        throw new Error("Keyword and type are required.");
    }
    try {
        return execute(
            "INSERT INTO filter_keywords (keyword, type, is_regex) VALUES (?, ?, ?)",
            [keyword.trim(), type, is_regex]
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
