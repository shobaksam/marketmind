'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mm-theme');
    if (stored === 'light') {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mm-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mm-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
