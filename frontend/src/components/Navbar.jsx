import React from 'react';
import { Video, ArrowDownToLine, Sparkles } from 'lucide-react';

const Navbar = () => {
  const scrollToSupported = (e) => {
    e.preventDefault();
    const el = document.getElementById('supported-platforms');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0e0e0e]/85 border-b border-[#222]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight text-white">
              URL<span className="text-primary-500">2Vid</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#181818] text-gray-400 border border-[#2a2a2a]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Fast & Free
            </span>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <a
            href="#supported-platforms"
            onClick={scrollToSupported}
            className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
          >
            Supported Sites
          </a>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const input = document.querySelector('input[type="url"]');
              if (input) input.focus();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#333] transition-all text-xs sm:text-sm font-semibold active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4 text-primary-400" />
            <span>Paste URL</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
