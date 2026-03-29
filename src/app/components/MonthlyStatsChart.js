import useSWR from 'swr';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UK_MONTHS = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

const fetcher = url => fetch(url).then(res => res.json());

const MonthlyStatsChart = () => {
    const now = new Date();
    // Состояния для месяца и года
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    // Флаг: показывать календарный месяц (с 1-го числа) или "скользящие" последние 30 дней
    const [isCalendarMonth, setIsCalendarMonth] = useState(false);

    const apiUrl = isCalendarMonth
        ? `/api/stats/monthly?year=${selectedYear}&month=${selectedMonth}`
        : '/api/stats/monthly';

    const { data, error } = useSWR(apiUrl, fetcher);

    if (error) return <div className="p-4 text-red-500 text-center">Помилка завантаження статистики за місяць.</div>;
    if (!data) return <div className="p-4 text-center">Завантаження місячної статистики...</div>;

    const chartData = data.data || [];
    if (chartData.length === 0) {
        return <div className="p-4 text-gray-500 text-center">Немає даних за останній місяць.</div>;
    }

    // Карты для имен и цветов типов статистики
    const metaMap = (data.meta?.statTypes || []).reduce((acc, type) => {
        acc[type.id] = { name: type.name, color: type.color };
        return acc;
    }, {});

    const statTypeIds = data.meta?.statTypes?.map(t => t.id) || [];

    return (
        <div style={{ width: '100%', minHeight: 400 }} className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex justify-between items-start mb-4 flex-col md:flex-row gap-4">
                <h3 className="text-lg font-semibold">
                    {isCalendarMonth
                        ? `Статистика за ${UK_MONTHS[selectedMonth - 1]} ${selectedYear}`
                        : 'Активність за останні 30 днів'}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="month-select" className="text-sm text-gray-500 dark:text-gray-400">Оберіть місяць:</label>

                    <select
                        value={selectedMonth}
                        onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setIsCalendarMonth(true); }}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {UK_MONTHS.map((name, i) => (
                            <option key={i} value={i + 1}>{name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setIsCalendarMonth(true); }}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 3 }, (_, i) => now.getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {isCalendarMonth && (
                        <button
                            onClick={() => {
                                setIsCalendarMonth(false);
                                setSelectedMonth(now.getMonth() + 1);
                                setSelectedYear(now.getFullYear());
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                            Скинути
                        </button>
                    )}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="day"
                        tickFormatter={(str) => str.split('-').reverse().slice(0, 2).join('.')}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: 'rgba(51, 65, 85, 0.9)',
                            borderRadius: '10px'
                        }}
                        labelStyle={{ color: '#fff' }}
                        labelFormatter={(str) => str.split('-').reverse().join('.')}
                    />
                    <Legend />
                    {statTypeIds.map(id => (
                        <Line
                            type="monotone"
                            key={id}
                            dataKey={id}
                            stroke={metaMap[id]?.color || '#8884d8'}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name={metaMap[id]?.name || `Type ${id}`}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyStatsChart;
