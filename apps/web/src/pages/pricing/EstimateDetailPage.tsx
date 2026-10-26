import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { calculatePrice, formatMoney } from '@afa/shared';
import type { PricingEstimate, PricingInput } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { ExportPdfButton } from '../../components/documents/ExportPdfButton.tsx';
import { PrintableDocument } from '../../components/documents/PrintableDocument.tsx';
import { BreakdownTable } from '../../components/pricing/BreakdownTable.tsx';
import { SuggestionPanel } from '../../components/pricing/SuggestionPanel.tsx';
import { priceLines, quoteText } from '../../components/pricing/priceLines.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { QueryError } from '../../components/ui/QueryError.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useDeleteEstimate, useEstimate } from '../../features/pricing/api.ts';
import type { ProposalPrefill } from '../../features/proposals/prefill.ts';
import { ApiError } from '../../lib/api.ts';
import { timeAgo } from '../../lib/time.ts';

export function EstimateDetailPage() {
  const { id = '' } = useParams();
  const query = useEstimate(id);

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-label="Loading estimate">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Card>
          <h1 className="text-lg font-semibold">Estimate not found</h1>
          <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
          <Link
            to="/pricing"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to pricing
          </Link>
        </Card>
      );
    }
    return (
      <Card>
        <QueryError
          message="Couldn't load this estimate."
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </Card>
    );
  }

  return <Estimate estimate={query.data} />;
}

function Estimate({ estimate }: { estimate: PricingEstimate }) {
  const toast = useToast();
  const navigate = useNavigate();
  const remove = useDeleteEstimate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Same inputs, same maths as the server: the rows match the stored total
  const input: PricingInput = { ...estimate, taxRate: estimate.taxRate ?? undefined };
  const price = calculatePrice(input);
  const lines = priceLines(input, price);

  // "Use this price": the exact saved total, formatted here (never by the AI)
  const days = estimate.aiSuggestion?.deliveryDays;
  const proposalPrefill: ProposalPrefill = {
    projectTitle: estimate.title,
    projectDescription: estimate.description ?? undefined,
    budget: `${formatMoney(price.total, estimate.currency)} fixed price${
      estimate.taxRate ? ` (incl. ${Number(estimate.taxRate)}% tax)` : ''
    }`,
    timeline: days && (days.min === days.max ? `${days.min} days` : `${days.min}–${days.max} days`),
    source: `your “${estimate.title}” estimate`,
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(estimate.id);
      toast.success('Estimate deleted');
      navigate('/pricing', { replace: true });
    } catch (err) {
      setConfirmDelete(false);
      toast.error(err instanceof Error ? err.message : "Couldn't delete the estimate.");
    }
  };

  return (
    <>
      <PageHeader
        title={estimate.title}
        description={`Price estimate · created ${timeAgo(estimate.createdAt)}`}
        actions={
          <Link to="/pricing" className="text-sm font-medium text-primary hover:underline">
            ← Pricing
          </Link>
        }
      />

      <PrintableDocument
        kind="Price estimate"
        title={estimate.title}
        meta={[new Date(estimate.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })]}
        body={[estimate.description, quoteText(lines, estimate.currency)]
          .filter(Boolean)
          .join('\n\n')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Price" className="min-w-0 self-start lg:col-span-2">
          {estimate.description && (
            <p className="mb-4 text-sm whitespace-pre-line text-muted">{estimate.description}</p>
          )}
          <BreakdownTable lines={lines} currency={estimate.currency} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/proposals/new', { state: { proposalPrefill } })}>
              Use this price
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/pricing', { state: { from: estimate } })}
            >
              Edit as new estimate
            </Button>
            <CopyButton text={quoteText(lines, estimate.currency)} />
            <ExportPdfButton fileName={`Estimate - ${estimate.title}`} />
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </Card>

        <Card title="AI suggestions" className="min-w-0 lg:col-span-3">
          {estimate.aiSuggestion ? (
            <SuggestionPanel
              suggestion={estimate.aiSuggestion}
              currency={estimate.currency}
              subtotal={price.subtotal}
            />
          ) : (
            <p className="text-sm text-muted">
              No AI suggestion was saved with this estimate. Use{' '}
              <strong>Edit as new estimate</strong> to get one.
            </p>
          )}
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this estimate?"
        footer={
          <>
            <Button variant="secondary" autoFocus onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      >
        The “{estimate.title}” estimate will be removed from your history. This can't be undone.
      </Modal>
    </>
  );
}
