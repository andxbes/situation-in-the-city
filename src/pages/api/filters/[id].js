import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { deleteFilterKeyword } from '@/database/filterKeywords';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const result = deleteFilterKeyword(id);
            if (result.changes === 0) {
                return res.status(404).json({ message: 'Keyword not found.' });
            }
            return res.status(200).json({ message: 'Keyword deleted successfully.' });
        } catch (error) {
            console.error(`API Error deleting keyword ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
