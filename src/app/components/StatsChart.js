import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
        <div style={{ width: '100%', height: 600 }}>
            <h3>Активность по часам (обновляется каждую минуту)</h3>
            <ResponsiveContainer>
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#333',
                            borderColor: '#555',
                            borderRadius: '5px'
                        }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {statTypes.map(type => (
                        <Bar
                            key={type}
                            dataKey={type}
                            fill={colorMap[type] || '#8884d8'}
                            name={type.charAt(0).toUpperCase() + type.slice(1)} // Делаем имя красивее
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StatsChart;
