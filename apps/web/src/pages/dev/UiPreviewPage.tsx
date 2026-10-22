import { useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Spinner } from '../../components/ui/Spinner.tsx';
import { useToast } from '../../components/ui/Toast.tsx';

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
