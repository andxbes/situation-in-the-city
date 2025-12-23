'use client';

import Link from "next/link";
import StatsChart from "@/app/components/StatsChart";

export default function Home() {
  return (
    <main className="flex w-full min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Статистика Активности</h1>
        <div className="container" style={{ marginTop: '2rem' }}>
          <StatsChart />
        </div>
        <div className="text-center mt-8">
          <Link className="px-5 py-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg cursor-pointer hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" href="/dashboard">Перейти в Панель Управления</Link>
        </div>
      </div>
    </main>
  );
}
