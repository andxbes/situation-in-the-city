'use server'
// database/db.js
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

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

export const addUser = (data) => {

    data = {
        ...{
            'email': '',
            'password': '',
            'role': 'subscriber'
        },
        ...data
    };

    const { email, password, role } = data;

    if (email.length == 0 || !email.includes('@')) {
        throw Error('Wrong Email');
    }

    if (password.length < 6) {
        throw Error('Wrong Password');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role]);
}

// Инициализация базы данных и создание таблицы users, если ее нет
export const initializeDatabase = () => {
    execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `);

    // Проверяем, есть ли администраторы
    const adminCount = getOne('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'])?.count;

    // Если нет администраторов, создаем первого
    if (adminCount === 0) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        try {
            addUser({
                'email': adminEmail,
                'password': adminPassword,
                'role': 'admin'
            });
            // execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
            console.log('Создан первый пользователь-администратор.');
        } catch (error) {
            console.error('Ошибка при создании первого администратора:', error);
        }
    }
};

initializeDatabase();

export default db;
