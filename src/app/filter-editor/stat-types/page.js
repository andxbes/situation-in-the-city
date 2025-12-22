'use client'

import { useState, useEffect, useCallback } from 'react';
import withRoleAuth from '../../components/ProtectedRoute';
import Link from 'next/link';

function StatTypesPage() {
    const [statTypes, setStatTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null); // { id, name } or { name: '' } for new
    const [inputValue, setInputValue] = useState('');

    const fetchStatTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/filters/stat-types');
            if (!response.ok) throw new Error('Failed to fetch stat types');
            const data = await response.json();
            setStatTypes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatTypes();
    }, [fetchStatTypes]);

    const handleEdit = (statType) => {
        setEditing(statType);
        setInputValue(statType.name);
    };

    const handleAddNew = () => {
        setEditing({ name: '' }); // New item has no ID yet
        setInputValue('');
    };

    const handleCancel = () => {
        setEditing(null);
        setInputValue('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            alert('Name cannot be empty.');
            return;
        }

        const isNew = !editing.id;
        const url = '/api/filters/stat-types';
        const method = isNew ? 'POST' : 'PUT';
        const body = isNew ? { name: inputValue } : { id: editing.id, name: inputValue };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save stat type');
            }

            await fetchStatTypes();
            handleCancel();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this stat type? This might affect existing keywords.')) {
            try {
                const response = await fetch('/api/filters/stat-types', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete stat type');
                }

                await fetchStatTypes();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Управление типами статистики</h1>
                <Link href="/filter-editor" className="text-blue-500 hover:underline">&larr; Назад к редактору фильтров</Link>
            </div>

            {editing && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-2">{editing.id ? 'Редактировать тип' : 'Добавить новый тип'}</h2>
                    <form onSubmit={handleSave} className="flex items-center gap-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                            placeholder="Название типа"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Сохранить</button>
                        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Отмена</button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <button onClick={handleAddNew} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Добавить новый тип</button>
                {loading && <p>Загрузка...</p>}
                {error && <p className="text-red-500">Ошибка: {error}</p>}
                <ul className="space-y-2">
                    {statTypes.map(st => (
                        <li key={st.id} className="flex justify-between items-center p-2 border-b dark:border-gray-700">
                            <span>{st.name} ({st.id})</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(st)} className="text-sm text-blue-500 hover:underline">Редактировать</button>
                                <button onClick={() => handleDelete(st.id)} className="text-sm text-red-500 hover:underline">Удалить</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default withRoleAuth(StatTypesPage, ["admin"]);
