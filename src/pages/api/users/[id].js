import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { updateUserRole } from '../../../database/user';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }

    const { id } = req.query;
    const { role } = req.body;

    if (req.method === 'PUT') {
        if (!role || !['admin', 'user', 'subscriber'].includes(role)) {
            return res.status(400).json({ message: 'A valid role is required.' });
        }

        // Запрещаем администратору изменять свою собственную роль
        if (session.user.id === id) {
            return res.status(400).json({ message: "Admins cannot change their own role through this interface." });
        }

        try {
            const result = updateUserRole(id, role);
            if (result.changes > 0) {
                return res.status(200).json({ message: 'User role updated successfully.' });
            } else {
                return res.status(404).json({ message: 'User not found or role was not changed.' });
            }
        } catch (error) {
            console.error(`API Error updating role for user ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
