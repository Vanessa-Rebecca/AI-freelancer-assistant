import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TONES, coverLetterInputSchema, toneLabels } from '@afa/shared';
import type { CoverLetterInput, GeneratedDraft } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { DocumentEditor } from '../../components/documents/DocumentEditor.tsx';
import { GenerateButton } from '../../components/documents/GenerateButton.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { FormAlert } from '../../components/ui/FormAlert.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useGenerateCoverLetter, useSaveCoverLetter } from '../../features/coverLetters/api.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';
import { useZodForm } from '../../lib/useZodForm.ts';

const toneOptions = TONES.map((t) => ({ value: t, label: toneLabels[t] }));

type Generated = { draft: GeneratedDraft; input: CoverLetterInput };

export function NewCoverLetterPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const generate = useGenerateCoverLetter();
  const save = useSaveCoverLetter();

  // What the AI last produced, and the inputs that produced it (used when saving)
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [content, setContent] = useState('');
  const [pendingInput, setPendingInput] = useState<CoverLetterInput | null>(null);
  const [saved, setSaved] = useState(false);

  const edited = generated !== null && content !== generated.draft.content;
  const blocker = useUnsavedChangesGuard(generated !== null && !saved);

  const runGenerate = async (input: CoverLetterInput) => {
    const draft = await generate.mutateAsync(input);
    setGenerated({ draft, input });
    setContent(draft.content);
    if (draft.truncated) {
      toast.info('The letter was cut short. Try Regenerate or the Concise tone.');
    }
  };

  const form = useZodForm(coverLetterInputSchema, async (input) => {
    if (edited) setPendingInput(input);
    else await runGenerate(input);
  });

  const onSave = async () => {
    if (!generated) return;
    try {
      const coverLetter = await save.mutateAsync({
        ...generated.input,
        content: content.trim(),
        promptVersion: generated.draft.promptVersion,
      });
      setSaved(true);
      toast.success('Cover letter saved');
      setTimeout(() => navigate(`/cover-letters/${coverLetter.id}`, { replace: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the cover letter.");
    }
  };

  return (
    <>
      <PageHeader
        title="New cover letter"
        description="Tell us about the job and your experience; AI writes a tailored first draft."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Job details" className="min-w-0">
          <FormAlert message={form.formError} />
          <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                {...form.field('jobTitle')}
                label="Job title"
                placeholder="Junior Frontend Developer"
              />
              <Input {...form.field('companyName')} label="Company" placeholder="Globex" />
            </div>
            <Textarea
              {...form.field('experience')}
              label="Your experience"
              rows={4}
              placeholder="Projects you've built, roles you've had, results you're proud of…"
            />
            <Input
              {...form.field('skills')}
              label="Skills"
              placeholder="React, TypeScript, Figma"
              hint="Separate skills with commas"
            />
            <Input
              {...form.field('portfolioUrl')}
              label="Portfolio URL"
              type="url"
              placeholder="https://yoursite.com"
              hint="Optional"
            />
            <Textarea
              {...form.field('jobDescription')}
              label="Job description"
              rows={4}
              placeholder="Paste the job ad here…"
              hint="Optional: paste the job ad for a more tailored letter"
            />
            <Select
              {...form.field('tone')}
              label="Tone"
              options={toneOptions}
              defaultValue="PROFESSIONAL"
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

        <Card title="Your cover letter" className="min-w-0">
          {generated || generate.isPending ? (
            <>
              <DocumentEditor
                label="Cover letter text"
                value={content}
                onChange={setContent}
                busy={generate.isPending}
                placeholder="Your cover letter will appear here…"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyButton text={content} />
                <Button
                  onClick={onSave}
                  loading={save.isPending}
                  disabled={!generated || generate.isPending || !content.trim()}
                >
                  Save cover letter
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              Fill in the job details and click <strong>Generate with AI</strong>. Your draft will
              appear here, ready to edit.
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
        You have changed the draft. Regenerating replaces it with a new version and uses 1 credit.
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
        Your cover letter hasn't been saved. If you leave now, the draft is lost.
      </Modal>
    </>
  );
}
