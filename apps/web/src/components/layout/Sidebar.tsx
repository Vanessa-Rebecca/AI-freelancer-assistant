import { Link, NavLink } from 'react-router';
import { cn } from '../../lib/cn.ts';
import { Icon } from '../ui/Icon.tsx';
import { navSections } from './nav.ts';

// Used both as the fixed desktop sidebar and inside the mobile drawer
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-2 px-5 font-semibold"
      >
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
        >
          AI
        </span>
        Freelancer Assistant
      </Link>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navSections.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-muted uppercase">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-primary',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted hover:bg-surface-muted hover:text-foreground',
                      )
                    }
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
