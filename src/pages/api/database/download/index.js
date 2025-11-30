import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // Для Pages Router сессию нужно получать из объектов req и res
    const session = await getServerSession(req, res, authOptions);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const dbName = process.env.DB_NAME ?? 'database.db';
        const dbPath = path.resolve(process.cwd(), dbName);

        if (!fs.existsSync(dbPath)) {
            return res.status(404).json({ message: 'Database file not found.' });
        }

        const fileBuffer = fs.readFileSync(dbPath);
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(dbPath)}"`);
        res.setHeader('Content-Type', 'application/x-sqlite3');
        return res.status(200).send(fileBuffer);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to download database file.', error: error.message });
    }
}
