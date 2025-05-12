'use client'
export default function Error({ error }) {
    return (

        <>
            {/*
        This example requires updating your template:

        ```
        <html class="h-full">
        <body class="h-full">
        ```
      */}
            <main className="grid min-h-screen place-items-center bg-white dark:bg-background px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-9xl font-semibold text-indigo-600 dark:text-yellow-500">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-amber-600 sm:text-7xl">
                        502
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-gray-500 dark:text-amber-600 sm:text-xl/8">
                        {error?.message || 'Error'}
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/"
                            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white dark:bg-amber-800 dark:text-orange-300 shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Go back home
                        </Link>
                        <Link href="/" className="text-sm font-semibold text-gray-900 dark:text-amber-600">
                            Contact support <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
};
