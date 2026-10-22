import { Link } from 'react-router';
import type { ActivityItem, DashboardStats } from '@afa/shared';
import { useAuth } from '../auth/AuthContext.tsx';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import type { IconName } from '../components/ui/Icon.tsx';
import { QueryError } from '../components/ui/QueryError.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { useDashboardStats, useRecentActivity } from '../features/dashboard/api.ts';
import { cn } from '../lib/cn.ts';
import { timeAgo } from '../lib/time.ts';

const statWidgets: { key: keyof DashboardStats; label: string; icon: IconName; to: string }[] = [
  { key: 'proposals', label: 'Proposals', icon: 'proposal', to: '/proposals' },
  { key: 'coverLetters', label: 'Cover letters', icon: 'coverLetter', to: '/cover-letters' },
  { key: 'activeClients', label: 'Active clients', icon: 'clients', to: '/clients' },
  { key: 'invoices', label: 'Invoices', icon: 'invoice', to: '/invoices' },
  { key: 'aiCredits', label: 'AI credits', icon: 'sparkles', to: '/settings' },
];

const quickActions: { label: string; description: string; icon: IconName; to: string }[] = [
  { label: 'New proposal', description: 'Win a project', icon: 'proposal', to: '/proposals' },
  {
    label: 'Cover letter',
    description: 'Apply for a job',
    icon: 'coverLetter',
    to: '/cover-letters',
  },
  { label: 'Reply to a client', description: 'Answer a message', icon: 'reply', to: '/replies' },
  { label: 'New invoice', description: 'Get paid', icon: 'invoice', to: '/invoices' },
  { label: 'Price a project', description: 'Estimate a quote', icon: 'pricing', to: '/pricing' },
  { label: 'Draft a contract', description: 'Agree the terms', icon: 'contract', to: '/contracts' },
];

const activityIcon: Record<ActivityItem['entityType'], IconName> = {
  PROPOSAL: 'proposal',
  COVER_LETTER: 'coverLetter',
  GIG: 'gig',
  PRICING: 'pricing',
  REPLY: 'reply',
  INVOICE: 'invoice',
  CONTRACT: 'contract',
  CLIENT: 'clients',
};

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.profile?.fullName.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here's an overview of your freelance work."
      />
      <div className="space-y-6">
        <StatWidgets />
        {/* grid-cols-1 + min-w-0 let cards shrink so long activity lines truncate */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
    </>
  );
}

function StatWidgets() {
  const { data, isPending, isError, refetch, isFetching } = useDashboardStats();

  if (isError) {
    return (
      <Card>
        <QueryError
          message="Couldn't load your stats."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      </Card>
    );
  }

  return (
    <section
      aria-label="Your stats"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {statWidgets.map((w) => (
        <Link
          key={w.key}
          to={w.to}
          className={cn(
            'group rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors sm:p-5',
            'hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary',
            // Five cards: let the last one span both columns on phones
            w.key === 'aiCredits' && 'col-span-2 sm:col-span-1',
          )}
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-sm font-medium">{w.label}</span>
            <Icon name={w.icon} className="size-5 group-hover:text-primary" />
          </div>
          {isPending ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tabular-nums">{data[w.key]}</p>
          )}
        </Link>
      ))}
    </section>
  );
}

function RecentActivity() {
  const { data, isPending, isError, refetch, isFetching } = useRecentActivity(10);

  return (
    <Card title="Recent activity" className="min-w-0 lg:col-span-2">
      {isPending ? (
        <ul className="space-y-4" aria-label="Loading activity">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <QueryError
          message="Couldn't load recent activity."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-sm text-muted">
            Create a proposal or add a client and it will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name={activityIcon[item.entityType]} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.summary}</p>
                <time
                  dateTime={item.createdAt}
                  title={new Date(item.createdAt).toLocaleString()}
                  className="text-xs text-muted"
                >
                  {timeAgo(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function QuickActions() {
  return (
    <Card title="Quick actions" className="min-w-0">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
        {quickActions.map((a) => (
          <li key={a.label}>
            <Link
              to={a.to}
              className="flex h-full flex-col gap-1 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name={a.icon} className="size-5 text-primary" />
              <span className="text-sm font-medium">{a.label}</span>
              <span className="text-xs text-muted">{a.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
