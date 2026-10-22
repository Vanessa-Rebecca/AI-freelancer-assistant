import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext.tsx';
import { currentTheme, setTheme } from '../../lib/theme.ts';
import type { ThemeMode } from '../../lib/theme.ts';
import { Icon } from '../ui/Icon.tsx';

const iconButton =
  'inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>(currentTheme);
  const name = user?.profile?.fullName ?? user?.email ?? '';

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onOpenMenu} className={`${iconButton} lg:hidden`}>
        <Icon name="menu" />
        <span className="sr-only">Open menu</span>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <span
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          title="AI credits remaining"
        >
          <Icon name="sparkles" className="size-4" />
          {user?.aiCredits ?? 0}
          <span className="sr-only">AI credits remaining</span>
        </span>

        <button type="button" onClick={toggleTheme} className={iconButton}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          <span className="sr-only">Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span>
        </button>

        {/* Native popover: closes on outside click and Escape without extra code */}
        <button
          type="button"
          popoverTarget="user-menu"
          className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {initials(name) || <Icon name="user" />}
          <span className="sr-only">Account menu</span>
        </button>
        <div
          id="user-menu"
          popover="auto"
          className="fixed inset-auto top-16 right-4 m-0 w-60 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user?.profile?.fullName}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <MenuLink to="/profile" icon="user" label="Profile" />
          <MenuLink to="/settings" icon="settings" label="Settings" />
          <button type="button" onClick={logout} className={menuItem}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

const menuItem =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary';

function MenuLink({ to, icon, label }: { to: string; icon: 'user' | 'settings'; label: string }) {
  return (
    <Link
      to={to}
      className={menuItem}
      onClick={() => document.getElementById('user-menu')?.hidePopover()}
    >
      <Icon name={icon} />
      {label}
    </Link>
  );
}
