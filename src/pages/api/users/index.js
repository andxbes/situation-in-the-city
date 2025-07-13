import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getAllUsers, getUserByEmail } from '@/database/user';


export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (req.method === 'GET') {
        try {
            if (session.user.role === 'admin') {
                const users = getAllUsers();
                return res.status(200).json(users);
            } else {
                // Для не-администраторов возвращаем только их данные
                const user = getUserByEmail(session.user.email);
                if (user) {
                    // Важно: не отправляем хэш пароля на клиент
                    const { password, ...userData } = user;
                    return res.status(200).json([userData]); // Возвращаем в виде массива для консистентности
                }
                return res.status(404).json({ message: 'User not found.' });
            }
        } catch (error) {
            console.error('API Error fetching users:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
