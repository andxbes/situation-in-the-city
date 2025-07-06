import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    // Получаем сессию на сервере
    const session = await getServerSession(req, res, authOptions);

    // 1. Проверяем, аутентифицирован ли пользователь
    if (!session) {
        return res.status(401).json({ message: "Not authenticated. Please sign in." });
    }

    // 2. Проверяем, есть ли у пользователя необходимая роль
    const allowedRoles = ['admin', 'user'];
    if (!session.user?.role || !allowedRoles.includes(session.user.role)) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to access this resource." });
    }

    // 3. Если все проверки пройдены, выполняем основную логику
    if (req.method === 'GET') {
        // Здесь может быть логика получения сообщений из чата
        res.status(200).json({ messages: `Hello, ${session.user.email}! Here are your chat messages.` });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
