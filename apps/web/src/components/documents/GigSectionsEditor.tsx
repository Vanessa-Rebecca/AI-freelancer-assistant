import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { gigContentSchema } from '@afa/shared';
import type { GigContent, GigFaq } from '@afa/shared';
import { Button } from '../ui/Button.tsx';
import { Input, Textarea } from '../ui/Field.tsx';
import { Icon } from '../ui/Icon.tsx';
import { DocumentEditor } from './DocumentEditor.tsx';

// Fiverr's description limit; the app itself allows more for other marketplaces
const FIVERR_LIMIT = 1200;
const MAX_KEYWORDS = 15;
const MAX_FAQS = 10;

type GigSectionsEditorProps = {
  value: GigContent;
  onChange: (value: GigContent) => void;
  // True while the AI is writing
  busy?: boolean;
};

// The three parts of a gig, each edited in the way that suits it
export function GigSectionsEditor({ value, onChange, busy = false }: GigSectionsEditorProps) {
  const set = <K extends keyof GigContent>(key: K, v: GigContent[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <div>
        <DocumentEditor
          label="Description"
          value={value.description}
          onChange={(v) => set('description', v)}
          maxLength={3000}
          busy={busy}
          placeholder="Your gig description will appear here…"
        />
        {value.description.length > FIVERR_LIMIT && (
          <p className="mt-1 text-xs text-warning">
            Longer than Fiverr's {FIVERR_LIMIT.toLocaleString()}-character limit. Fine for other
            marketplaces.
          </p>
        )}
      </div>

      <KeywordChips
        keywords={value.seoKeywords}
        onChange={(v) => set('seoKeywords', v)}
        disabled={busy}
      />

      <FaqList faqs={value.faqs} onChange={(v) => set('faqs', v)} disabled={busy} />
    </div>
  );
}

function KeywordChips({
  keywords,
  onChange,
  disabled,
}: {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const full = keywords.length >= MAX_KEYWORDS;

  // Pasting "a, b, c" adds all three; duplicates are ignored
  const add = () => {
    const fresh = draft
      .split(',')
      .map((k) => k.trim().toLowerCase().slice(0, 60))
      .filter((k) => k && !keywords.includes(k));
    if (fresh.length) onChange([...new Set([...keywords, ...fresh])].slice(0, MAX_KEYWORDS));
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !draft && keywords.length) {
      onChange(keywords.slice(0, -1));
    }
  };

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium">SEO keywords</legend>
      {keywords.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Keywords">
          {keywords.map((k) => (
            <li
              key={k}
              className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1 pl-3 text-sm text-primary"
            >
              {k}
              <button
                type="button"
                onClick={() => onChange(keywords.filter((x) => x !== k))}
                aria-label={`Remove keyword ${k}`}
                className="rounded-full p-1 hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name="close" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          Add a keyword
        </label>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={full}
          maxLength={200}
          placeholder={full ? `Up to ${MAX_KEYWORDS} keywords` : 'Add a keyword and press Enter'}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-muted focus:outline-2 focus:outline-primary disabled:opacity-70"
        />
        <Button variant="secondary" onClick={add} disabled={full || !draft.trim()}>
          Add
        </Button>
      </div>
      <p className="text-xs text-muted">
        {keywords.length} of {MAX_KEYWORDS}. Buyers search with these, so keep them short and
        specific.
      </p>
    </fieldset>
  );
}

function FaqList({
  faqs,
  onChange,
  disabled,
}: {
  faqs: GigFaq[];
  onChange: (faqs: GigFaq[]) => void;
  disabled: boolean;
}) {
  const edit = (i: number, patch: Partial<GigFaq>) =>
    onChange(faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium">FAQs</legend>
      {/* Inputs are fully controlled, so index keys stay correct when an item is removed */}
      <ol className="space-y-3">
        {faqs.map((f, i) => (
          <li key={i} className="space-y-3 rounded-xl border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  label={`Question ${i + 1}`}
                  value={f.question}
                  maxLength={300}
                  onChange={(e) => edit(i, { question: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-6"
                onClick={() => onChange(faqs.filter((_, j) => j !== i))}
                aria-label={`Remove question ${i + 1}`}
              >
                <Icon name="close" className="size-4" />
              </Button>
            </div>
            <Textarea
              label="Answer"
              rows={3}
              value={f.answer}
              maxLength={1500}
              onChange={(e) => edit(i, { answer: e.target.value })}
            />
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange([...faqs, { question: '', answer: '' }])}
        disabled={faqs.length >= MAX_FAQS}
      >
        Add a question
      </Button>
    </fieldset>
  );
}

// Plain-text version for copying and printing: description, keywords, then FAQs
export function gigToText({ description, seoKeywords, faqs }: GigContent) {
  const parts = [description.trim()];
  if (seoKeywords.length) parts.push(`Keywords: ${seoKeywords.join(', ')}`);
  if (faqs.length) {
    parts.push(
      'Frequently asked questions',
      ...faqs.map((f) => `${f.question.trim()}\n${f.answer.trim()}`),
    );
  }
  return parts.join('\n\n');
}

// The same rules the server applies on save, as one readable message (or null if fine)
export function checkGigContent(content: GigContent) {
  const result = gigContentSchema.safeParse(content);
  if (result.success) return null;
  const issue = result.error.issues[0];
  if (!issue) return null;
  const [field, index] = issue.path;
  return field === 'faqs' && typeof index === 'number'
    ? `FAQ ${index + 1}: ${issue.message}`
    : issue.message;
}
