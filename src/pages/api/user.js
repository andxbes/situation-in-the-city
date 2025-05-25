import { addUser } from "@/database/db";

export default function handler(req, res) {
    if (req.method === 'GET') {
        res.status(200).json({ name: 'Иван' });
    } else if (req.method === 'POST') {

        const { email, password } = req.body;
        try {
            addUser({
                'email': email,
                'password': password
            });

            res.status(201).json({ message: `Create new user: ${email}` });
        } catch (error) {
            res.status(500).json({ message: 'Error creating user' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Метод ${req.method} не разрешён`);
    }
}
