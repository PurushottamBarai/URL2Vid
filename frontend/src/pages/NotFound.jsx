import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="flex-1 flex flex-col items-center justify-center pt-8 md:pt-14 pb-24 px-4 w-full max-w-2xl mx-auto text-center">
      <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Page Not Found</h2>
      <p className="text-text-secondary mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">
        Go Back Home
      </Link>
    </main>
  );
};

export default NotFound;
