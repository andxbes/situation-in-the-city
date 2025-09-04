import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    // 1. Проверяем, является ли пользователь администратором
    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }

    if (req.method === 'GET') {
        // Путь к вашему лог-файлу
        const logFilePath = path.join(process.cwd(), 'logs', 'app.log');

        try {
            // 2. Проверяем, существует ли файл логов
            if (!fs.existsSync(logFilePath)) {
                return res.status(404).json({ message: "Log file not found." });
            }

            // 3. Устанавливаем заголовки, чтобы браузер предложил скачать файл
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="app.log"');

            // 4. Стримим файл в ответ, чтобы не загружать его целиком в память
            const readStream = fs.createReadStream(logFilePath);
            readStream.pipe(res);

        } catch (error) {
            // Логируем ошибку через наш логгер, если он доступен
            const logger = require('@/utils/logger');
            logger.error('Error reading log file for download:', error);
            res.status(500).json({ message: "An error occurred while reading the log file." });
        }
    } else {
        // Разрешаем только GET-запросы
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
