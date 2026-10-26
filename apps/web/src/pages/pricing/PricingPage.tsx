import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  COMPLEXITIES,
  CURRENCIES,
  URGENCIES,
  calculatePrice,
  complexityLabels,
  formatMoney,
  pricingInputSchema,
  pricingProjectSchema,
  toHundredths,
  urgencyLabels,
} from '@afa/shared';
import type { PricingEstimate, PricingSuggestion } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { DocumentList } from '../../components/documents/DocumentList.tsx';
import { GenerateButton } from '../../components/documents/GenerateButton.tsx';
import { BreakdownTable } from '../../components/pricing/BreakdownTable.tsx';
import { SuggestionPanel } from '../../components/pricing/SuggestionPanel.tsx';
import { priceLines } from '../../components/pricing/priceLines.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { FormAlert } from '../../components/ui/FormAlert.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import {
  usePricingHistory,
  useSaveEstimate,
  useSuggestPricing,
} from '../../features/pricing/api.ts';
import { useListParams } from '../../lib/useListParams.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';

const MAX_EXTRAS = 20;

// Everything as typed; parsed with the shared schemas on every render
type Draft = {
  title: string;
  description: string;
  currency: string;
  hourlyRate: string;
  hours: string;
  complexity: string;
  urgency: string;
  taxRate: string;
  extras: { label: string; amount: string }[];
};

const EMPTY: Draft = {
  title: '',
  description: '',
  currency: 'USD',
  hourlyRate: '',
  hours: '',
  complexity: 'SIMPLE',
  urgency: 'NORMAL',
  taxRate: '',
  extras: [],
};

// "Edit as new estimate" passes a saved estimate in the navigation state
const fromEstimate = (e: PricingEstimate): Draft => ({
  title: e.title,
  description: e.description ?? '',
  currency: e.currency,
  hourlyRate: e.hourlyRate,
  hours: e.hours,
  complexity: e.complexity,
  urgency: e.urgency,
  taxRate: e.taxRate ?? '',
  extras: e.extras,
});

const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));
const complexityOptions = COMPLEXITIES.map((c) => ({ value: c, label: complexityLabels[c] }));
const urgencyOptions = URGENCIES.map((u) => ({ value: u, label: urgencyLabels[u] }));

export function PricingPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const suggest = useSuggestPricing();
  const save = useSaveEstimate();

  const [draft, setDraft] = useState<Draft>(() => {
    const from = (location.state as { from?: PricingEstimate } | null)?.from;
    return from ? fromEstimate(from) : EMPTY;
  });
  // After Save or Suggest is clicked, empty required fields show their errors too
  const [attempted, setAttempted] = useState(false);
  const [suggestion, setSuggestion] = useState<{ data: PricingSuggestion; inputs: string } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Live price: recalculated on every keystroke, no request
  const calc = useMemo(() => {
    const parsed = pricingInputSchema.safeParse(draft);
    return parsed.success ? { input: parsed.data, price: calculatePrice(parsed.data) } : null;
  }, [draft]);

  const project = pricingProjectSchema.safeParse(draft);
  const errors: Record<string, string> = {};
  if (!project.success) {
    for (const issue of project.error.issues) errors[issue.path.join('.')] ??= issue.message;
  }

  // A field shows its error once it has something wrong typed in, or after an attempt
  const errorFor = (path: string, value: string) =>
    attempted || value.trim() ? errors[path] : undefined;

  const inputsKey = project.success ? JSON.stringify(project.data) : '';
  const stale = suggestion !== null && suggestion.inputs !== inputsKey;
  const blocker = useUnsavedChangesGuard(suggestion !== null && !saved);

  const onSuggest = async () => {
    setAttempted(true);
    if (!project.success) return;
    try {
      const result = await suggest.mutateAsync(project.data);
      setSuggestion({ data: result.suggestion, inputs: JSON.stringify(project.data) });
    } catch {
      // Shown in the panel from suggest.error
    }
  };

  const onSave = async () => {
    setAttempted(true);
    if (!project.success) return;
    try {
      const estimate = await save.mutateAsync({
        ...project.data,
        // A suggestion about different inputs would be misleading next to this price
        ...(suggestion && !stale && { aiSuggestion: suggestion.data }),
      });
      setSaved(true);
      toast.success('Estimate saved');
      setTimeout(() => navigate(`/pricing/${estimate.id}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the estimate.");
    }
  };

  const setExtra = (i: number, patch: Partial<Draft['extras'][number]>) =>
    set(
      'extras',
      draft.extras.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    );

  return (
    <>
      <PageHeader
        title="Smart pricing"
        description="Work out a fair price for a project, then get an AI second opinion."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Project" className="min-w-0 lg:col-span-3">
          <div className="space-y-4">
            <Input
              label="Project name"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              error={errorFor('title', draft.title)}
              maxLength={120}
              placeholder="Bakery website"
            />
            <Textarea
              label="What's the work?"
              rows={3}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              error={errorFor('description', draft.description)}
              maxLength={2000}
              placeholder="5-page website for a small bakery with a menu and an order enquiry form"
              hint="Optional, but the AI suggestions are much better with it"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Currency"
                value={draft.currency}
                onChange={(e) => set('currency', e.target.value)}
                options={currencyOptions}
              />
              <Input
                label="Hourly rate"
                inputMode="decimal"
                value={draft.hourlyRate}
                onChange={(e) => set('hourlyRate', e.target.value)}
                error={errorFor('hourlyRate', draft.hourlyRate)}
                placeholder="25"
              />
              <Input
                label="Estimated hours"
                inputMode="decimal"
                value={draft.hours}
                onChange={(e) => set('hours', e.target.value)}
                error={errorFor('hours', draft.hours)}
                placeholder="40"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Complexity"
                value={draft.complexity}
                onChange={(e) => set('complexity', e.target.value)}
                options={complexityOptions}
              />
              <Select
                label="Urgency"
                value={draft.urgency}
                onChange={(e) => set('urgency', e.target.value)}
                options={urgencyOptions}
              />
              <Input
                label="Tax (%)"
                inputMode="decimal"
                value={draft.taxRate}
                onChange={(e) => set('taxRate', e.target.value)}
                error={errorFor('taxRate', draft.taxRate)}
                placeholder="Optional, e.g. 16"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Extras</legend>
              <p className="text-xs text-muted">
                Costs that aren't your time, e.g. a domain, hosting or stock photos.
              </p>
              {draft.extras.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      label={`Extra ${i + 1}`}
                      value={e.label}
                      onChange={(ev) => setExtra(i, { label: ev.target.value })}
                      error={errorFor(`extras.${i}.label`, e.label)}
                      maxLength={80}
                      placeholder="Domain name"
                    />
                  </div>
                  <div className="w-32 shrink-0">
                    <Input
                      label="Amount"
                      inputMode="decimal"
                      value={e.amount}
                      onChange={(ev) => setExtra(i, { amount: ev.target.value })}
                      error={errorFor(`extras.${i}.amount`, e.amount)}
                      placeholder="15"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-7"
                    onClick={() =>
                      set(
                        'extras',
                        draft.extras.filter((_, j) => j !== i),
                      )
                    }
                    aria-label={`Remove extra ${i + 1}`}
                  >
                    <Icon name="close" className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => set('extras', [...draft.extras, { label: '', amount: '' }])}
                disabled={draft.extras.length >= MAX_EXTRAS}
              >
                Add an extra
              </Button>
            </fieldset>
          </div>
        </Card>

        <Card title="Price" className="min-w-0 self-start lg:sticky lg:top-20 lg:col-span-2">
          <div aria-live="polite">
            {calc ? (
              <BreakdownTable
                lines={priceLines(calc.input, calc.price)}
                currency={calc.input.currency}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted">
                Enter your hourly rate and hours to see the price.
              </p>
            )}
          </div>
          <Button className="mt-5 w-full" onClick={onSave} loading={save.isPending}>
            Save estimate
          </Button>
          {attempted && !project.success && (
            <p className="mt-2 text-center text-xs text-danger">
              Fix the highlighted fields first.
            </p>
          )}
        </Card>
      </div>

      <Card
        title="AI suggestions"
        description="A suggested price range, delivery time, market positioning and tips."
        className="mt-6 min-w-0"
      >
        <FormAlert message={suggest.error ? suggest.error.message : null} />
        {suggestion && calc && (
          <div className="mb-5">
            <SuggestionPanel
              suggestion={suggestion.data}
              currency={calc.input.currency}
              subtotal={calc.price.subtotal}
              stale={stale}
            />
          </div>
        )}
        <GenerateButton
          generating={suggest.isPending}
          credits={1}
          label={suggestion ? 'Get a fresh suggestion' : 'Get AI suggestions'}
          onClick={onSuggest}
        />
      </Card>

      <SavedEstimates />

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Leave without saving?"
        footer={
          <>
            <Button variant="secondary" onClick={() => blocker.reset?.()}>
              Stay
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              Leave
            </Button>
          </>
        }
      >
        Your AI suggestion hasn't been saved. Save the estimate to keep it.
      </Modal>
    </>
  );
}

function SavedEstimates() {
  const list = useListParams();
  const query = usePricingHistory(list.q, list.page);

  const data = query.data && {
    ...query.data,
    items: query.data.items.map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: formatMoney(toHundredths(e.total), e.currency),
      badge: complexityLabels[e.complexity].replace(/ \(.*\)/, ''),
      createdAt: e.createdAt,
    })),
  };

  return (
    <section className="mt-8" aria-labelledby="saved-estimates">
      <h2 id="saved-estimates" className="mb-3 text-base font-semibold">
        Saved estimates
      </h2>
      <DocumentList
        data={data}
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        onRetry={() => query.refetch()}
        search={list.search}
        onSearch={list.setSearch}
        page={list.page}
        onPage={list.setPage}
        hrefFor={(id) => `/pricing/${id}`}
        searchLabel="Search estimates"
        empty={<p className="text-muted">No saved estimates yet. Save one above to see it here.</p>}
      />
    </section>
  );
}
