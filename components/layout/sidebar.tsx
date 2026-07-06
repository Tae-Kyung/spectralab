'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  FolderSearch,
  FlaskConical,
  GitCompareArrows,
  BookOpen,
  Atom,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/upload', label: '데이터 업로드', icon: Upload },
  { href: '/explorer', label: '데이터 탐색', icon: FolderSearch },
  { href: '/compare', label: '비교 뷰', icon: GitCompareArrows },
  { href: '/tutorial', label: '튜토리얼', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isWorkbench = pathname.startsWith('/workbench');

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Atom className="h-6 w-6 shrink-0 text-cyan-400" />
        {!collapsed && (
          <span className="ml-2 text-sm font-bold text-cyan-400 whitespace-nowrap">
            SpectraLab
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isWorkbench && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
              'bg-cyan-500/10 text-cyan-400'
            )}
          >
            <FlaskConical className="h-4 w-4 shrink-0" />
            {!collapsed && <span>분석 워크벤치</span>}
          </div>
        )}
      </nav>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
