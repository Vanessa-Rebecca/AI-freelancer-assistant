import { useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Spinner } from '../../components/ui/Spinner.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { DocumentEditor } from '../../components/documents/DocumentEditor.tsx';
import { DocumentList } from '../../components/documents/DocumentList.tsx';
import type { ListItem } from '../../components/documents/DocumentList.tsx';
import { GenerateButton } from '../../components/documents/GenerateButton.tsx';
import { useListParams } from '../../lib/useListParams.ts';

// 23 fake documents so search and paging can be tried without the API
const fakeDocs: ListItem[] = Array.from({ length: 23 }, (_, i) => ({
  id: `doc-${i + 1}`,
  title: i % 5 === 0 ? `Bakery website ${i + 1}` : `Logo design project ${i + 1}`,
  subtitle: `Client ${i + 1}`,
  badge: i % 2 ? 'Friendly' : 'Professional',
  preview:
    'Hi there, I would love to help with your project. Here is how I would approach it, the timeline I propose and the budget it needs, in more words than fit on two lines of the list.',
  createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
}));

function DocumentsPreview() {
  const [text, setText] = useState('Hi Sarah,\n\nI would love to build your bakery website.');
  const [generating, setGenerating] = useState(false);
  const list = useListParams();
  const matches = fakeDocs.filter((d) => d.title.toLowerCase().includes(list.q.toLowerCase()));
  const pageSize = 10;
  const data = {
    items: matches.slice((list.page - 1) * pageSize, list.page * pageSize),
    page: list.page,
    pageSize,
    total: matches.length,
    totalPages: Math.ceil(matches.length / pageSize),
  };

  return (
    <>
      <Card
        title="Document editor"
        description="Grows with its content; counts words and characters"
      >
        <DocumentEditor label="Proposal" value={text} onChange={setText} busy={generating} />
        <div className="mt-4 flex flex-wrap gap-3">
          <GenerateButton
            generating={generating}
            credits={1}
            onClick={() => {
              setGenerating(true);
              setTimeout(() => setGenerating(false), 3500);
            }}
          />
          <CopyButton text={text} />
        </div>
      </Card>
      <DocumentList
        data={data}
        isPending={false}
        isError={false}
        isFetching={false}
        onRetry={() => {}}
        search={list.search}
        onSearch={list.setSearch}
        page={list.page}
        onPage={list.setPage}
        hrefFor={(id) => `/dev/ui#${id}`}
        searchLabel="Search documents"
        empty={<p className="text-muted">No documents yet.</p>}
      />
    </>
  );
}

// Development-only gallery of every UI component (route /dev/ui, not in production builds)
export function UiPreviewPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">UI components</h1>
        <Button variant="secondary" onClick={toggleTheme}>
          Toggle light / dark
        </Button>
      </header>

      <Card title="Buttons" description="Variants, sizes and states">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          >
            {loading ? 'Generating…' : 'Click to load'}
          </Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Card>

      <Card title="Form fields" description="Label, hint and error linked for screen readers">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" placeholder="Jane Doe" hint="As it appears on invoices" />
          <Input
            label="Email"
            type="email"
            defaultValue="not-an-email"
            error="Enter a valid email address"
            required
          />
          <Select
            label="Tone"
            placeholder="Choose a tone"
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly' },
            ]}
          />
          <Input label="Disabled" disabled defaultValue="Can't edit this" />
          <div className="sm:col-span-2">
            <Textarea label="Project description" placeholder="Describe the project…" />
          </div>
        </div>
      </Card>

      <Card title="Feedback">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => toast.success('Proposal saved')}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Couldn't reach the server")}>
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Generating your proposal…')}>
            Info toast
          </Button>
          <Button variant="danger" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <span className="text-primary">
            <Spinner size="sm" /> <Spinner /> <Spinner size="lg" />
          </span>
        </div>
      </Card>

      <DocumentsPreview />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete this proposal?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.success('Proposal deleted');
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        This can't be undone. The proposal will be removed from your history.
      </Modal>
    </main>
  );
}
