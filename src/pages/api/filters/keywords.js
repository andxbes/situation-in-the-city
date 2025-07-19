import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { addFilterKeyword, getAllFilterKeywords } from '@/database/filterKeywords';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.method === 'GET') {
        try {
            const keywords = getAllFilterKeywords();
            return res.status(200).json(keywords);
        } catch (error) {
            console.error('API Error fetching keywords:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { keyword, type, is_regex } = req.body;
            if (!keyword || !type) {
                return res.status(400).json({ message: 'Keyword and type are required.' });
            }

            const result = addFilterKeyword({ keyword, type, is_regex: is_regex ? 1 : 0 });
            return res.status(201).json({ message: 'Keyword added successfully', id: result.lastInsertRowid });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ message: error.message });
            }
            console.error('API Error adding keyword:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
