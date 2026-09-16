import React from 'react';
import PropTypes from 'prop-types';

const ErrorBanner = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="w-full max-w-3xl mt-6 text-center" role="alert" aria-live="polite">
      <p className="text-error font-medium text-sm">{message}</p>
    </div>
  );
};

ErrorBanner.propTypes = {
  message: PropTypes.string,
};

export default ErrorBanner;
