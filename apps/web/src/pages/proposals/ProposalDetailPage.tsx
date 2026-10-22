import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toneLabels } from '@afa/shared';
import type { Proposal } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { DocumentEditor } from '../../components/documents/DocumentEditor.tsx';
import { ExportPdfButton } from '../../components/documents/ExportPdfButton.tsx';
import { PrintableDocument } from '../../components/documents/PrintableDocument.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { QueryError } from '../../components/ui/QueryError.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useDeleteProposal, useProposal, useUpdateProposal } from '../../features/proposals/api.ts';
import { ApiError } from '../../lib/api.ts';
import { timeAgo } from '../../lib/time.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';

export function ProposalDetailPage() {
  const { id = '' } = useParams();
  const query = useProposal(id);

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-label="Loading proposal">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Card>
          <h1 className="text-lg font-semibold">Proposal not found</h1>
          <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
          <Link
            to="/proposals"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to proposals
          </Link>
        </Card>
      );
    }
    return (
      <Card>
        <QueryError
          message="Couldn't load this proposal."
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </Card>
    );
  }

  // Keyed by id: the editor starts from the loaded text once, so a background
  // refresh can never overwrite what the user is typing
  return <ProposalEditor key={query.data.id} proposal={query.data} />;
}

function ProposalEditor({ proposal }: { proposal: Proposal }) {
  const toast = useToast();
  const navigate = useNavigate();
  const update = useUpdateProposal(proposal.id);
  const remove = useDeleteProposal();

  const [content, setContent] = useState(proposal.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Compared with the latest saved copy, which update() refreshes in the cache
  const dirty = content.trim() !== proposal.content && !deleted;
  const blocker = useUnsavedChangesGuard(dirty);

  const onSave = async () => {
    try {
      await update.mutateAsync({ content: content.trim() });
      toast.success('Changes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your changes.");
    }
  };

  const onDelete = async () => {
    try {
      setDeleted(true);
      await remove.mutateAsync(proposal.id);
      toast.success('Proposal deleted');
      navigate('/proposals', { replace: true });
    } catch (err) {
      setDeleted(false);
      setConfirmDelete(false);
      toast.error(err instanceof Error ? err.message : "Couldn't delete the proposal.");
    }
  };

  // createdAt (database) and updatedAt (Prisma) differ by a few ms on creation,
  // so only a real gap counts as an edit
  const edited =
    new Date(proposal.updatedAt).getTime() - new Date(proposal.createdAt).getTime() > 2000;

  return (
    <>
      <PageHeader
        title={proposal.projectTitle}
        description={`For ${proposal.clientName} · created ${timeAgo(proposal.createdAt)}${
          edited ? ` · edited ${timeAgo(proposal.updatedAt)}` : ''
        }`}
        actions={
          <Link to="/proposals" className="text-sm font-medium text-primary hover:underline">
            ← All proposals
          </Link>
        }
      />

      {/* Prints the text in the editor, including unsaved edits */}
      <PrintableDocument
        kind="Proposal"
        title={proposal.projectTitle}
        meta={[
          `Prepared for ${proposal.clientName}`,
          new Date().toLocaleDateString(undefined, { dateStyle: 'long' }),
        ]}
        body={content}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <DocumentEditor label="Proposal text" value={content} onChange={setContent} />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={onSave}
              loading={update.isPending}
              disabled={!dirty || !content.trim()}
            >
              Save changes
            </Button>
            <CopyButton text={content} />
            <ExportPdfButton
              fileName={`Proposal - ${proposal.projectTitle} - ${proposal.clientName}`}
            />
            <Button variant="danger" className="sm:ml-auto" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </Card>

        <Card title="Project details" className="min-w-0">
          <dl className="space-y-3 text-sm">
            <Detail label="Client" value={proposal.clientName} />
            <Detail label="Budget" value={proposal.budget} />
            <Detail label="Timeline" value={proposal.timeline} />
            <Detail label="Tone" value={toneLabels[proposal.tone]} />
            <Detail label="Skills" value={proposal.skills.join(', ')} />
          </dl>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-primary">
              Client's project description
            </summary>
            <p className="mt-2 whitespace-pre-line text-muted">{proposal.projectDescription}</p>
          </details>
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this proposal?"
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
        “{proposal.projectTitle}” will be removed from your history. This can't be undone.
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
        Your changes to this proposal haven't been saved.
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
