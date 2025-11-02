import Link from "next/link";

export default function Home() {
  return (
    <>
      <Link className="px-5 py-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg cursor-pointer hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mx-auto" href="/dashboard">Dashboard</Link>
    </>
  );
}
