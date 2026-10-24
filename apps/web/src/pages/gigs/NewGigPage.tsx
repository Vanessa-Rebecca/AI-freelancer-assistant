import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { EXPERIENCE_LEVELS, experienceLevelLabels, gigInputSchema } from '@afa/shared';
import type { GeneratedGig, GigContent, GigInput } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { GenerateButton } from '../../components/documents/GenerateButton.tsx';
import {
  GigSectionsEditor,
  checkGigContent,
  gigToText,
} from '../../components/documents/GigSectionsEditor.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { FormAlert } from '../../components/ui/FormAlert.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useGenerateGig, useSaveGig } from '../../features/gigs/api.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';
import { useZodForm } from '../../lib/useZodForm.ts';
import { revisionsLabel } from './labels.ts';

const levelOptions = EXPERIENCE_LEVELS.map((l) => ({ value: l, label: experienceLevelLabels[l] }));
const revisionOptions = Array.from({ length: 11 }, (_, n) => ({
  value: String(n),
  label: revisionsLabel(n),
}));

const EMPTY: GigContent = { description: '', seoKeywords: [], faqs: [] };

const sectionsOf = ({ description, seoKeywords, faqs }: GigContent): GigContent => ({
  description,
  seoKeywords,
  faqs,
});

type Generated = { draft: GeneratedGig; input: GigInput };

export function NewGigPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const generate = useGenerateGig();
  const save = useSaveGig();

  // What the AI last produced, and the inputs that produced it (used when saving)
  const [generated, setGenerated] = useState<Generated | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [content, setContent] = useState<GigContent>(EMPTY);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<GigInput | null>(null);
  const [saved, setSaved] = useState(false);

  const edited =
    generated !== null && JSON.stringify(content) !== JSON.stringify(sectionsOf(generated.draft));
  const blocker = useUnsavedChangesGuard(generated !== null && !saved);

  const runGenerate = async (input: GigInput) => {
    const draft = await generate.mutateAsync(input);
    setGenerated({ draft, input });
    setContent(sectionsOf(draft));
    setSaveError(null);
    // The result panel can be above (scrolled past) or below (phones) the button
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const form = useZodForm(gigInputSchema, async (input) => {
    if (edited) setPendingInput(input);
    else await runGenerate(input);
  });

  const onSave = async () => {
    if (!generated) return;
    const problem = checkGigContent(content);
    setSaveError(problem);
    if (problem) return;
    try {
      const gig = await save.mutateAsync({
        ...generated.input,
        ...content,
        promptVersion: generated.draft.promptVersion,
      });
      setSaved(true);
      toast.success('Gig saved');
      setTimeout(() => navigate(`/gigs/${gig.id}`, { replace: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the gig.");
    }
  };

  return (
    <>
      <PageHeader
        title="New gig description"
        description="Describe your service; AI writes the description, SEO keywords and FAQs."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Your service" className="min-w-0">
          <FormAlert message={form.formError} />
          <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
            <Input
              {...form.field('category')}
              label="Category"
              placeholder="Website development"
              hint="The service you sell, e.g. Logo design or WordPress websites"
            />
            <Input
              {...form.field('skills')}
              label="Skills"
              placeholder="React, Node.js, Tailwind CSS"
              hint="Separate skills with commas"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                {...form.field('experienceLevel')}
                label="Experience"
                options={levelOptions}
                defaultValue="INTERMEDIATE"
              />
              <Input
                {...form.field('deliveryDays')}
                label="Delivery (days)"
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                defaultValue={3}
              />
              <Select
                {...form.field('revisions')}
                label="Revisions"
                options={revisionOptions}
                defaultValue="2"
              />
            </div>
            <Textarea
              {...form.field('features')}
              label="What's included"
              rows={5}
              placeholder={'Responsive design for phones and desktops\nUp to 5 pages\nContact form'}
              hint="One feature per line"
            />
            <GenerateButton
              type="submit"
              generating={generate.isPending}
              credits={1}
              label={generated ? 'Regenerate' : 'Generate with AI'}
              className="w-full"
            />
          </form>
        </Card>

        <Card ref={resultRef} title="Your gig" className="min-w-0 scroll-mt-20">
          {generated || generate.isPending ? (
            <>
              <GigSectionsEditor value={content} onChange={setContent} busy={generate.isPending} />
              <div className="mt-6">
                <FormAlert message={saveError} />
                <div className="flex flex-wrap gap-3">
                  <CopyButton text={generated ? gigToText(content) : ''} label="Copy all" />
                  <Button
                    onClick={onSave}
                    loading={save.isPending}
                    disabled={!generated || generate.isPending}
                  >
                    Save gig
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              Fill in your service and click <strong>Generate with AI</strong>. The description,
              keywords and FAQs will appear here, ready to edit.
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={pendingInput !== null}
        onClose={() => setPendingInput(null)}
        title="Replace your edits?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingInput(null)}>
              Keep my edits
            </Button>
            <Button
              onClick={() => {
                const input = pendingInput;
                setPendingInput(null);
                if (input) runGenerate(input).catch((e: Error) => toast.error(e.message));
              }}
            >
              Regenerate
            </Button>
          </>
        }
      >
        You have changed the gig. Regenerating replaces it with a new version and uses 1 credit.
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
        Your gig hasn't been saved. If you leave now, it is lost.
      </Modal>
    </>
  );
}
