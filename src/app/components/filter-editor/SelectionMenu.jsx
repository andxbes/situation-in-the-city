'use client';

export default function SelectionMenu({ selection, onAddKeyword, onClose }) {
    if (!selection.show) {
        return null;
    }

    const menuStyle = {
        position: 'absolute',
        top: `${selection.y}px`,
        left: `${selection.x}px`,
        zIndex: 1000,
    };

    return (
        <div style={menuStyle} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 flex flex-col gap-1 text-sm">
            <div className="font-bold text-gray-900 dark:text-white px-2 py-1 border-b border-gray-200 dark:border-gray-600">
                "{selection.text}"
            </div>
            <button
                onClick={() => onAddKeyword(selection.text, 'positive_word')}
                className="text-left text-green-700 dark:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1"
            >
                Добавить в позитивные
            </button>
            <button
                onClick={() => onAddKeyword(selection.text, 'negative_word')}
                className="text-left text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1"
            >
                Добавить в негативные
            </button>
            <button onClick={onClose} className="text-left text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1 mt-1 border-t border-gray-200 dark:border-gray-600">
                Закрыть
            </button>
        </div>
    );
}
