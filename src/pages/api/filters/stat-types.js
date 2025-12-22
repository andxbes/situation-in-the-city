import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getKeywordStatTypes, addKeywordStatType, deleteKeywordStatType, updateKeywordStatType } from '@/database/filterKeywords';

export default async function handler(req, res) {

    if (req.method === 'GET') {
        try {
            const statTypes = getKeywordStatTypes();
            return res.status(200).json(statTypes);
        } catch (error) {
            console.error('API Error fetching keyword stat types:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.method === 'POST') {
        try {
            const { name, color } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Name is required.' });
            }
            const result = addKeywordStatType(name, color);
            return res.status(201).json({ message: 'Stat type added successfully', id: result.lastInsertRowid });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ message: error.message });
            }
            console.error('API Error adding stat type:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { id, name, color } = req.body;
            if (!id || !name) {
                return res.status(400).json({ message: 'ID and name are required.' });
            }
            const result = updateKeywordStatType({ id, name, color });
            if (result.changes === 0) {
                return res.status(404).json({ message: 'Stat type not found.' });
            }
            return res.status(200).json({ message: 'Stat type updated successfully.' });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ message: error.message });
            }
            console.error(`API Error updating stat type ${req.body.id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;
            const result = deleteKeywordStatType(id);
            if (result.changes === 0) {
                return res.status(404).json({ message: 'Stat type not found.' });
            }
            return res.status(200).json({ message: 'Stat type deleted successfully.' });
        } catch (error) {
            console.error(`API Error deleting stat type ${req.body.id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
