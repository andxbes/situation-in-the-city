'use client'

import { useState, useEffect } from 'react';

export default function KeywordEditorModal({ keyword, statTypes, onSave, onClose }) {
    const [formData, setFormData] = useState({
        keyword: '',
        type: 'positive',
        is_regex: 0,
        stat_type_id: ''
    });

    useEffect(() => {
        if (keyword) {
            setFormData({
                keyword: keyword.keyword || '',
                type: keyword.type || 'positive',
                is_regex: keyword.is_regex ? 1 : 0,
                stat_type_id: keyword.stat_type_id || ''
            });
        }
    }, [keyword]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'is_regex') {
            setFormData(prev => ({ ...prev, is_regex: checked ? 1 : 0 }));
        } else if (name === 'stat_type_id') {
            // Allow empty string, otherwise convert to number
            const numValue = value === '' ? '' : Number(value);
            if (!isNaN(numValue)) {
                setFormData(prev => ({ ...prev, [name]: numValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            stat_type_id: formData.stat_type_id === '' ? null : formData.stat_type_id,
        };
        if (keyword.id) {
            dataToSave.id = keyword.id;
        }
        onSave(dataToSave);
    };

    if (!keyword) return null;

    const isNew = !keyword.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{isNew ? 'Добавить' : 'Редактировать'} ключевое слово</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ключевое слово</label>
                        <input type="text" name="keyword" id="keyword" value={formData.keyword} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm" required />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Тип</label>
                        <div className="mt-1 flex gap-4">
                            <label className="inline-flex items-center">
                                <input type="radio" name="type" value="positive" checked={formData.type === 'positive'} onChange={handleChange} className="form-radio text-green-600" />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Positive</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input type="radio" name="type" value="negative" checked={formData.type === 'negative'} onChange={handleChange} className="form-radio text-red-600" />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Negative</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="stat_type_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stat Type ID</label>
                        <select name="stat_type_id" id="stat_type_id" value={formData.stat_type_id} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm">
                            <option value="">(пусто)</option>
                            {statTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="inline-flex items-center">
                            <input type="checkbox" name="is_regex" checked={formData.is_regex === 1} onChange={handleChange} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Является регулярным выражением</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Отмена
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
