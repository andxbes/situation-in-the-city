import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// SWR требует функцию-фетчер, которая будет выполнять запросы
const fetcher = url => fetch(url).then(res => res.json());

const StatsChart = () => {
    // Используем SWR для получения данных.
    // Он автоматически кеширует данные и обновляет их каждые 60 секунд.
    const { data, error } = useSWR('/api/stats/keywords', fetcher, {
        refreshInterval: 60000, // 60000 мс = 1 минута
    });

    if (error) return <div>Не удалось загрузить статистику.</div>;
    if (!data) return <div>Загрузка...</div>;

    // Получаем список типов статистики из данных (например, 'blue', 'green')
    const statTypes = Object.keys(data.daily || {});
    if (statTypes.length === 0) {
        return <div>Нет данных для отображения.</div>;
    }

    // Создаем карту цветов для удобного доступа
    const colorMap = (data.meta?.statTypes || []).reduce((acc, type) => {
        acc[type.name] = type.color;
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
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Активность по часам</h3>
                {data.meta?.dateNowFormat && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Обновлено: {data.meta.dateNowFormat} (обновляется каждую минуту)
                    </p>
                )}
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
                    {statTypes.map(type => (
                        <Line
                            type="monotone"
                            key={type}
                            dataKey={type}
                            stroke={colorMap[type] || '#8884d8'}
                            strokeWidth={2}
                            dot={false}
                            name={type.charAt(0).toUpperCase() + type.slice(1)} // Делаем имя красивее
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StatsChart;
