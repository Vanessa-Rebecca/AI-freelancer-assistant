import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { experienceLevelLabels } from '@afa/shared';
import type { GigContent, GigDescription } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { ExportPdfButton } from '../../components/documents/ExportPdfButton.tsx';
import {
  GigSectionsEditor,
  checkGigContent,
  gigToText,
} from '../../components/documents/GigSectionsEditor.tsx';
import { PrintableDocument } from '../../components/documents/PrintableDocument.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { FormAlert } from '../../components/ui/FormAlert.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { QueryError } from '../../components/ui/QueryError.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useDeleteGig, useGig, useUpdateGig } from '../../features/gigs/api.ts';
import { ApiError } from '../../lib/api.ts';
import { timeAgo } from '../../lib/time.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';
import { deliveryLabel, revisionsLabel } from './labels.ts';

const sectionsOf = ({ description, seoKeywords, faqs }: GigContent): GigContent => ({
  description,
  seoKeywords,
  faqs,
});

export function GigDetailPage() {
  const { id = '' } = useParams();
  const query = useGig(id);

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-label="Loading gig">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Card>
          <h1 className="text-lg font-semibold">Gig not found</h1>
          <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
          <Link
            to="/gigs"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to gigs
          </Link>
        </Card>
      );
    }
    return (
      <Card>
        <QueryError
          message="Couldn't load this gig."
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </Card>
    );
  }

  // Keyed by id so a background refresh never overwrites what the user is typing
  return <GigEditor key={query.data.id} gig={query.data} />;
}

function GigEditor({ gig }: { gig: GigDescription }) {
  const toast = useToast();
  const navigate = useNavigate();
  const update = useUpdateGig(gig.id);
  const remove = useDeleteGig();

  // What was last saved, so "dirty" compares against the server's cleaned-up copy
  const [savedContent, setSavedContent] = useState(() => sectionsOf(gig));
  const [content, setContent] = useState(savedContent);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const dirty = JSON.stringify(content) !== JSON.stringify(savedContent) && !deleted;
  const blocker = useUnsavedChangesGuard(dirty);

  const onSave = async () => {
    const problem = checkGigContent(content);
    setSaveError(problem);
    if (problem) return;
    try {
      const updated = await update.mutateAsync(content);
      // Show what was stored: keywords lowercased and de-duplicated, text trimmed
      const stored = sectionsOf(updated);
      setSavedContent(stored);
      setContent(stored);
      toast.success('Changes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your changes.");
    }
  };

  const onDelete = async () => {
    try {
      setDeleted(true);
      await remove.mutateAsync(gig.id);
      toast.success('Gig deleted');
      navigate('/gigs', { replace: true });
    } catch (err) {
      setDeleted(false);
      setConfirmDelete(false);
      toast.error(err instanceof Error ? err.message : "Couldn't delete the gig.");
    }
  };

  // createdAt and updatedAt differ by a few ms on creation; only a real gap is an edit
  const edited = new Date(gig.updatedAt).getTime() - new Date(gig.createdAt).getTime() > 2000;

  return (
    <>
      <PageHeader
        title={gig.category}
        description={`${experienceLevelLabels[gig.experienceLevel]} · created ${timeAgo(gig.createdAt)}${
          edited ? ` · edited ${timeAgo(gig.updatedAt)}` : ''
        }`}
        actions={
          <Link to="/gigs" className="text-sm font-medium text-primary hover:underline">
            ← All gigs
          </Link>
        }
      />

      {/* Prints what is in the editor, including unsaved edits */}
      <PrintableDocument
        kind="Gig description"
        title={gig.category}
        meta={[`${deliveryLabel(gig.deliveryDays)} · ${revisionsLabel(gig.revisions)}`]}
        body={gigToText(content)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <GigSectionsEditor value={content} onChange={setContent} />
          <div className="mt-6">
            <FormAlert message={saveError} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={onSave} loading={update.isPending} disabled={!dirty}>
                Save changes
              </Button>
              <CopyButton text={gigToText(content)} label="Copy all" />
              <ExportPdfButton fileName={`Gig - ${gig.category}`} />
              <Button
                variant="danger"
                className="sm:ml-auto"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Service details" className="min-w-0 self-start">
          <dl className="space-y-3 text-sm">
            <Detail label="Category" value={gig.category} />
            <Detail label="Experience" value={experienceLevelLabels[gig.experienceLevel]} />
            <Detail label="Delivery" value={deliveryLabel(gig.deliveryDays)} />
            <Detail label="Revisions" value={revisionsLabel(gig.revisions)} />
            <Detail label="Skills" value={gig.skills.join(', ')} />
          </dl>
          <div className="mt-4 text-sm">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Included</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {gig.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this gig?"
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
        The “{gig.category}” gig will be removed from your history. This can't be undone.
      </Modal>

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
        Your changes to this gig haven't been saved.
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
