'use client';

const OilBlobsBackground = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-20">
            <div className="absolute bg-purple-500 rounded-full w-72 h-72 blob-1 filter blur-2xl opacity-50"></div>
            <div className="absolute bg-yellow-500 rounded-full w-72 h-72 blob-2 filter blur-2xl opacity-50"></div>
            <div className="absolute bg-pink-500 rounded-full w-72 h-72 blob-3 filter blur-2xl opacity-50"></div>
            <div className="absolute bg-blue-500 rounded-full w-72 h-72 blob-4 filter blur-2xl opacity-50"></div>
            <div className="absolute bg-green-500 rounded-full w-72 h-72 blob-5 filter blur-2xl opacity-50"></div>
            <div className="absolute bg-red-500 rounded-full w-72 h-72 blob-6 filter blur-2xl opacity-50"></div>
        </div>
    );
};

export default OilBlobsBackground;
