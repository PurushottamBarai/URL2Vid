import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer className="w-full py-12 text-center text-text-secondary text-sm border-t border-border mt-auto">
          <p className="mb-2">Supported: YouTube, Instagram, Facebook, X, TikTok, Vimeo, Twitch, and more.</p>
          <p className="text-xs opacity-75">
            Disclaimer: This tool is for personal and educational use only.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
