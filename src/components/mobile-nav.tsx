'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Lightbulb, Plus, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: Lightbulb, label: 'Ideas' },
  { path: '/ideas/new', icon: Plus, label: 'New' },
  { path: '/compare', icon: BarChart3, label: 'Compare' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Only show on main pages, not on idea detail or share
  const showOn = ['/dashboard', '/ideas/new', '/compare'];
  if (!showOn.includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur border-t border-neutral-800 z-50 sm:hidden safe-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors ${
                active ? 'text-amber-400' : 'text-neutral-500'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
