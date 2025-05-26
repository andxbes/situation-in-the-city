'use server'
// database/db.js
import Database from 'better-sqlite3';

const db = new Database(process.env.DB_NAME ?? './database.db');

// Функция для выполнения запросов (для удобства)
export const query = (sql, params = []) => {
    try {
        const statement = db.prepare(sql);
        return statement.all(params);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
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
        console.error('Ошибка выполнения запроса:', error);
        throw error;
    }
};

// Функция для получения одной записи
export const getOne = (sql, params = []) => {
    try {
        const statement = db.prepare(sql);
        return statement.get(params);
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        throw error;
    }
};


export default db;
