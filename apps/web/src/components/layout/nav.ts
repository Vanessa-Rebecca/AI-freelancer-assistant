import type { IconName } from '../ui/Icon.tsx';

export type NavItem = { to: string; label: string; icon: IconName };

// Sidebar sections. Modules not built yet render a "coming soon" page.
export const navSections: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }] },
  {
    title: 'Write',
    items: [
      { to: '/proposals', label: 'Proposals', icon: 'proposal' },
      { to: '/cover-letters', label: 'Cover letters', icon: 'coverLetter' },
      { to: '/gigs', label: 'Gig descriptions', icon: 'gig' },
      { to: '/replies', label: 'Client replies', icon: 'reply' },
    ],
  },
  {
    title: 'Business',
    items: [
      { to: '/pricing', label: 'Pricing', icon: 'pricing' },
      { to: '/invoices', label: 'Invoices', icon: 'invoice' },
      { to: '/contracts', label: 'Contracts', icon: 'contract' },
      { to: '/clients', label: 'Clients', icon: 'clients' },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/history', label: 'History', icon: 'history' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];
