import bcrypt from 'bcryptjs';
import { execute, getOne, query } from './db';
import { initializeFilterKeywordsDatabase } from './filterKeywords';


export async function addUser(data) {

    const userData = {
        ...{
            'email': '',
            'password': '',
            'role': 'subscriber'
        },
        ...data
    };

    const { email, password, role } = userData;

    if (email.length == 0 || !email.includes('@')) {
        throw Error('Wrong Email');
    }

    if (password.length < 6) {
        throw Error('Wrong Password');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role]);
}


export const getAllUsers = () => {
    // Исключаем хэш пароля из результата
    return query('SELECT id, email, role FROM users');
};

export const updateUserRole = (id, role) => {
    return execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
};



export const getUserByEmail = (email) => {
    return getOne('SELECT id, email, password, role FROM users WHERE email = ?', [email]);
}


// Инициализация базы данных и создание таблицы users, если ее нет
export const initializeDatabase = async () => {
    execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `);

    // Инициализируем таблицу с ключевыми словами для фильтрации
    initializeFilterKeywordsDatabase();

    // Проверяем, есть ли администраторы
    const adminCount = getOne('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'])?.count;

    // Если нет администраторов, создаем первого
    if (adminCount === 0) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        try {
            await addUser({
                'email': adminEmail,
                'password': adminPassword,
                'role': 'admin'
            });
            console.log('Создан первый пользователь-администратор.');
        } catch (error) {
            console.error('Ошибка при создании первого администратора:', error);
        }
    }
};

initializeDatabase();
