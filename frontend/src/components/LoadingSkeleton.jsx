import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="w-full max-w-3xl mt-8 p-12 rounded-md bg-surface border border-border flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-orange opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-orange"></span>
        </div>
        <span className="text-accent-orange font-mono text-sm tracking-widest uppercase font-bold">Extracting Metadata</span>
      </div>
      <p className="text-text-secondary text-sm">Connecting to server and analyzing URL...</p>
    </div>
  );
};

export default LoadingSkeleton;
