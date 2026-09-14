import React from 'react';

const Navbar = () => {
  const scrollToSupported = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('supported-platforms');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-base/90 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center" aria-label="Home">
          <div className="h-8 md:h-10 flex items-center justify-center">
            <img src="/logo.png" alt="URL2Vid Logo" className="h-full w-auto object-contain" />
          </div>
        </a>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <a
            href="/#supported-platforms"
            onClick={scrollToSupported}
            className="text-text-secondary hover:text-accent transition-colors text-xs sm:text-sm"
          >
            Supported Sites
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
