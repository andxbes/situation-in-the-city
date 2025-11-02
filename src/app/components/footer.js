'use client'

import Link from "next/link";
import { useSession, signOut } from 'next-auth/react';

export default function Footer(params) {
    const { data: session, status } = useSession();

    return (
        <>
            <footer className="z-10 my-4 bg-[rgba(0_0_0_0)] px-4 container w-full mx-auto">
                <div className="w-full bg-white  rounded-lg dark:bg-gray-800  p-4 md:flex md:items-center md:justify-between">
                    <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <Link href="/" className="hover:underline">Sitename™</Link>. All Rights Reserved.
                    </span>
                    <div className="flex items-center mt-3 md:mt-0">
                        <ul className="flex flex-wrap items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                            <li>
                                <Link className='"hover:underline me-4 md:me-6' href="/dashboard">Dashboard</Link>
                            </li>
                            <li>
                                <Link className='"hover:underline me-4 md:me-6' href="/chat">Chat</Link>
                            </li>
                        </ul>
                        {status === 'authenticated' && (
                            <div className="relative group ml-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                                    {session.user.email}
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 w-max hidden group-hover:flex flex-col items-center bg-gray-700 text-white p-2 rounded-md shadow-lg z-10">
                                    <span className="text-xs whitespace-nowrap">Role: {session.user.role}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded text-xs w-full"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </>
    )
};
