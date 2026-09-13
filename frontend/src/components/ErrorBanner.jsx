import React from 'react';

const ErrorBanner = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="w-full max-w-3xl mt-6 text-center">
      <p className="text-error font-medium text-sm">{message}</p>
    </div>
  );
};

export default ErrorBanner;
