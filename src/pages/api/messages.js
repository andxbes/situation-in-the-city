import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getMessagesForPeriod } from "../../tg/tclient";
import { filter_messages } from "../../utils/utils";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Not authenticated. Please sign in." });
    }

    const allowedRoles = ['admin', 'user'];
    if (!session.user?.role || !allowedRoles.includes(session.user.role)) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }

    if (req.method === 'GET') {
        try {
            // Получаем 'hours' из параметров запроса, по умолчанию 1 час, если не указано.
            const hours = parseInt(req.query.hours, 10) || 1;

            // Вычисляем временную метку 'fromTime' в секундах.
            const fromTime = Math.floor(Date.now() / 1000) - (hours * 3600);

            // Получаем сообщения за указанный период.
            const allMessages = await getMessagesForPeriod(fromTime);

            // Фильтруем сообщения по ключевым словам и правилам.
            const filteredMessages = filter_messages(allMessages);

            // Отправляем отфильтрованные сообщения в ответе.
            res.status(200).json({ messages: filteredMessages });
        } catch (error) {
            console.error('Error fetching or filtering messages:', error);
            res.status(500).json({ message: "An error occurred while fetching messages." });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
