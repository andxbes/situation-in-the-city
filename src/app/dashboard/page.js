'use client'
import { useSession, signOut } from 'next-auth/react';
import withRoleAuth from '../components/ProtectedRoute';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function Page() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUsers() {
            if (!session) return;
            try {
                const res = await fetch('/api/users');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to fetch users');
                }
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [session]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update role');
            }

            // Обновляем локальное состояние для немедленного отображения изменений
            setUsers(currentUsers =>
                currentUsers.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );
        } catch (err) {
            alert(`Ошибка обновления роли: ${err.message}`);
        }
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;

    const isAdmin = session?.user?.role === 'admin';

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Добро пожаловать, {session?.user?.email}!</p>
            <button onClick={() => signOut()}>Выйти</button>

            <div className='my-4'>
                <Link className='px-5 py-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg cursor-pointer hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800' href="/chat">Chat</Link>
                {isAdmin && <Link className='ml-4 px-5 py-3 text-sm font-medium text-center text-white bg-green-700 rounded-lg cursor-pointer hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800' href="/filter-editor">Редактор фильтров</Link>}
            </div>

            <hr style={{ margin: '20px 0' }} />

            <h2 className='mb-4 font-bold text-3xl'>{isAdmin ? "Управление пользователями" : "Информация о вашем аккаунте"}</h2>

            {isAdmin ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Роль</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>{user.id}</td>
                                <td style={{ padding: '8px' }}>{user.email}</td>
                                <td style={{ padding: '8px' }}>
                                    <select className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-30' value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={user.id.toString() === session.user.id}>
                                        <option value="admin">admin</option>
                                        <option value="user">user</option>
                                        <option value="subscriber">subscriber</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                users.length > 0 && (
                    <div className='flex flex-col gap-4'>
                        <p><strong>Email:</strong> {users[0].email}</p>
                        <p><strong>Роль:</strong> {users[0].role}</p>
                        <p>
                            <Link className='px-5 py-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg cursor-pointer hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800' href="/chat">Chat</Link>
                        </p>
                    </div>
                )
            )}
        </div>
    );
};

export default withRoleAuth(Page, ['admin', 'user', 'subscriber']);
