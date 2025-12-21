import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { deleteFilterKeyword, updateFilterKeyword } from '@/database/filterKeywords';

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

    if (req.method === 'PUT') {
        try {
            const result = updateFilterKeyword({ id, ...req.body });
            if (result.changes === 0) {
                return res.status(404).json({ message: 'Keyword not found.' });
            }
            return res.status(200).json({ message: 'Keyword updated successfully.' });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ message: error.message });
            }
            console.error(`API Error updating keyword ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }


    res.setHeader('Allow', ['DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
