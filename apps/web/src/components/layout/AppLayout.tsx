import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../ui/Icon.tsx';
import { Sidebar } from './Sidebar.tsx';
import { Topbar } from './Topbar.tsx';

// Shell for every logged-in page: sidebar (drawer on small screens), top bar, content
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();

  // Native <dialog> gives the drawer a focus trap, Escape and an inert background
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (menuOpen && !drawer.open) drawer.showModal();
    if (!menuOpen && drawer.open) drawer.close();
  }, [menuOpen]);

  // Move focus to the page heading after navigation, so screen readers announce it
  useEffect(() => {
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <Sidebar />
      </aside>

      <dialog
        ref={drawerRef}
        aria-label="Menu"
        onClose={() => setMenuOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}
        className="m-0 h-full max-h-none w-72 max-w-[85vw] border-r border-border bg-surface p-0 text-foreground backdrop:bg-black/50 lg:hidden"
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
        >
          <Icon name="close" />
          <span className="sr-only">Close menu</span>
        </button>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </dialog>

      <div className="lg:pl-64">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
