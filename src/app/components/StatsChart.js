import useSWR from 'swr';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// SWR требует функцию-фетчер, которая будет выполнять запросы
const fetcher = url => fetch(url).then(res => res.json());

const StatsChart = () => {
    // Состояние для выбранной даты, по умолчанию сегодня (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Используем SWR для получения данных.
    // Ключ зависит от даты, поэтому при смене даты данные обновятся.
    const { data, error } = useSWR(`/api/stats/keywords?date=${selectedDate}`, fetcher);

    if (error) return <div>Не удалось загрузить статистику.</div>;
    if (!data) return <div>Загрузка...</div>;

    // Получаем список ID типов статистики из данных
    const statTypeIds = Object.keys(data.daily || {});
    if (statTypeIds.length === 0) {
        return <div>Нет данных для отображения.</div>;
    }

    // Создаем карты для быстрого доступа к имени и цвету по ID
    const metaMap = (data.meta?.statTypes || []).reduce((acc, type) => {
        acc[type.id] = { name: type.name, color: type.color };
        return acc;
    }, {});

    // Преобразуем почасовые данные для графика
    const chartData = data.hourly.map((hourData, index) => {
        return {
            hour: `${index}:00`,
            ...hourData,
        };
    });

    return (
        <div style={{ width: '100%', minHeight: 400 }}>
            <div className="flex justify-between items-center mb-2 flex-col md:flex-row gap-2">
                <h3 className="text-lg font-semibold">Активность по часам</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-black dark:text-white bg-transparent"
                    />
                    {data.meta?.dateNowFormat && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Данные за: {data.meta.dateNowFormat}
                        </p>
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
                    <XAxis dataKey="hour" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: 'rgba(51, 65, 85, 0.9)',
                            borderRadius: '10px'
                        }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {statTypeIds.map(id => (
                        <Line
                            type="monotone"
                            key={id}
                            dataKey={id}
                            stroke={metaMap[id]?.color || '#8884d8'}
                            strokeWidth={2}
                            dot={false}
                            name={metaMap[id]?.name || `Type ${id}`}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            <p className='p-4 text-md text-gray-500 dark:text-gray-400'>Статистика за каждый полный час, если смотрим 9 часов , то это количество за интервал времени от 9 до 10</p>
        </div>
    );
};

export default StatsChart;
