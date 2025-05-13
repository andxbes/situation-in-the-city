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
            <main className="grid min-h-screen place-items-center bg-white dark:bg-background px-6 py-24 sm:py-32 lg:px-8 mx-auto">
                <div className="text-center">
                    <p className="text-9xl font-semibold text-indigo-600 dark:text-yellow-500">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 dark:text-amber-600 sm:text-7xl">
                        500
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-gray-500 dark:text-amber-600 sm:text-xl/8">
                        {error?.message || 'Error'}
                    </p>
                </div>
            </main>
        </>
    );
};
