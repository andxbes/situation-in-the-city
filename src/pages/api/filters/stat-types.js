import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getKeywordStatTypes } from '@/database/filterKeywords';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.method === 'GET') {
        try {
            const statTypes = getKeywordStatTypes();
            return res.status(200).json(statTypes);
        } catch (error) {
            console.error('API Error fetching keyword stat types:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
