import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="w-full mt-4 p-6 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center animate-slide-up">
      <div className="flex items-center justify-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
        </span>
        <span className="text-orange-600 font-bold text-sm tracking-wider uppercase">
          EXTRACTING METADATA
        </span>
      </div>
      <p className="text-gray-500 text-sm mt-1.5">
        Connecting to server and analyzing URL...
      </p>
    </div>
  );
};

export default LoadingSkeleton;
