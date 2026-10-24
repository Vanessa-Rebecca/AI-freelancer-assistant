import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toneLabels } from '@afa/shared';
import type { CoverLetter } from '@afa/shared';
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
import {
  useCoverLetter,
  useDeleteCoverLetter,
  useUpdateCoverLetter,
} from '../../features/coverLetters/api.ts';
import { ApiError } from '../../lib/api.ts';
import { timeAgo } from '../../lib/time.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';

export function CoverLetterDetailPage() {
  const { id = '' } = useParams();
  const query = useCoverLetter(id);

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-label="Loading cover letter">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Card>
          <h1 className="text-lg font-semibold">Cover letter not found</h1>
          <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
          <Link
            to="/cover-letters"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to cover letters
          </Link>
        </Card>
      );
    }
    return (
      <Card>
        <QueryError
          message="Couldn't load this cover letter."
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
        />
      </Card>
    );
  }

  // Keyed by id so a background refresh never overwrites what the user is typing
  return <CoverLetterEditor key={query.data.id} letter={query.data} />;
}

function CoverLetterEditor({ letter }: { letter: CoverLetter }) {
  const toast = useToast();
  const navigate = useNavigate();
  const update = useUpdateCoverLetter(letter.id);
  const remove = useDeleteCoverLetter();

  const [content, setContent] = useState(letter.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const dirty = content.trim() !== letter.content && !deleted;
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
      await remove.mutateAsync(letter.id);
      toast.success('Cover letter deleted');
      navigate('/cover-letters', { replace: true });
    } catch (err) {
      setDeleted(false);
      setConfirmDelete(false);
      toast.error(err instanceof Error ? err.message : "Couldn't delete the cover letter.");
    }
  };

  // createdAt and updatedAt differ by a few ms on creation; only a real gap is an edit
  const edited = new Date(letter.updatedAt).getTime() - new Date(letter.createdAt).getTime() > 2000;

  return (
    <>
      <PageHeader
        title={letter.jobTitle}
        description={`${letter.companyName} · created ${timeAgo(letter.createdAt)}${
          edited ? ` · edited ${timeAgo(letter.updatedAt)}` : ''
        }`}
        actions={
          <Link to="/cover-letters" className="text-sm font-medium text-primary hover:underline">
            ← All cover letters
          </Link>
        }
      />

      {/* Prints the text in the editor, including unsaved edits */}
      <PrintableDocument
        kind="Cover letter"
        title={`${letter.jobTitle} — ${letter.companyName}`}
        meta={[new Date().toLocaleDateString(undefined, { dateStyle: 'long' })]}
        body={content}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <DocumentEditor label="Cover letter text" value={content} onChange={setContent} />
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
              fileName={`Cover letter - ${letter.jobTitle} - ${letter.companyName}`}
            />
            <Button variant="danger" className="sm:ml-auto" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </Card>

        <Card title="Application details" className="min-w-0">
          <dl className="space-y-3 text-sm">
            <Detail label="Job" value={letter.jobTitle} />
            <Detail label="Company" value={letter.companyName} />
            <Detail label="Tone" value={toneLabels[letter.tone]} />
            <Detail label="Skills" value={letter.skills.join(', ')} />
            {letter.portfolioUrl && (
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">
                  Portfolio
                </dt>
                <dd className="mt-0.5 truncate">
                  <a
                    href={letter.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {letter.portfolioUrl}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-primary">Your experience</summary>
            <p className="mt-2 whitespace-pre-line text-muted">{letter.experience}</p>
          </details>
          {letter.jobDescription && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-primary">Job description</summary>
              <p className="mt-2 whitespace-pre-line text-muted">{letter.jobDescription}</p>
            </details>
          )}
        </Card>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this cover letter?"
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
        The letter for “{letter.jobTitle}” at {letter.companyName} will be removed from your
        history. This can't be undone.
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
        Your changes to this cover letter haven't been saved.
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
