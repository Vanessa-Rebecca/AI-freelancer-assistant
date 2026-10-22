import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TONES, proposalInputSchema, toneLabels } from '@afa/shared';
import type { ProposalDraft, ProposalInput } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { CopyButton } from '../../components/documents/CopyButton.tsx';
import { DocumentEditor } from '../../components/documents/DocumentEditor.tsx';
import { GenerateButton } from '../../components/documents/GenerateButton.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Input, Select, Textarea } from '../../components/ui/Field.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { useToast } from '../../components/ui/Toast.tsx';
import { useGenerateProposal, useSaveProposal } from '../../features/proposals/api.ts';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard.ts';
import { useZodForm } from '../../lib/useZodForm.ts';
import { FormAlert } from '../../components/ui/FormAlert.tsx';

const toneOptions = TONES.map((t) => ({ value: t, label: toneLabels[t] }));

type Generated = { draft: ProposalDraft; input: ProposalInput };

export function NewProposalPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const generate = useGenerateProposal();
  const save = useSaveProposal();

  // What the AI last produced, and the inputs that produced it (used when saving)
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [content, setContent] = useState('');
  // Inputs waiting for "Replace your edits?" confirmation
  const [pendingInput, setPendingInput] = useState<ProposalInput | null>(null);
  const [saved, setSaved] = useState(false);

  const edited = generated !== null && content !== generated.draft.content;
  const blocker = useUnsavedChangesGuard(generated !== null && !saved);

  const runGenerate = async (input: ProposalInput) => {
    const draft = await generate.mutateAsync(input);
    setGenerated({ draft, input });
    setContent(draft.content);
    if (draft.truncated) {
      toast.info('The proposal was cut short. Try Regenerate or the Concise tone.');
    }
  };

  const form = useZodForm(proposalInputSchema, async (input) => {
    // Don't silently throw away hand edits
    if (edited) setPendingInput(input);
    else await runGenerate(input);
  });

  const onSave = async () => {
    if (!generated) return;
    try {
      const proposal = await save.mutateAsync({
        ...generated.input,
        content: content.trim(),
        promptVersion: generated.draft.promptVersion,
      });
      setSaved(true);
      toast.success('Proposal saved');
      // Let the guard see `saved` before navigating
      setTimeout(() => navigate(`/proposals/${proposal.id}`, { replace: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the proposal.");
    }
  };

  return (
    <>
      <PageHeader
        title="New proposal"
        description="Describe the project and let AI write a first draft for you to edit."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Project details" className="min-w-0">
          <FormAlert message={form.formError} />
          <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                {...form.field('clientName')}
                label="Client name"
                placeholder="Sarah, Acme Ltd"
              />
              <Input
                {...form.field('projectTitle')}
                label="Project title"
                placeholder="Bakery website"
              />
            </div>
            <Textarea
              {...form.field('projectDescription')}
              label="Project description"
              rows={6}
              placeholder="Paste the job post or describe what the client needs…"
            />
            <Input
              {...form.field('skills')}
              label="Skills"
              placeholder="React, Node.js, Figma"
              hint="Separate skills with commas"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input {...form.field('budget')} label="Budget" placeholder="$800 fixed price" />
              <Input {...form.field('timeline')} label="Timeline" placeholder="3 weeks" />
            </div>
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

        <Card title="Your proposal" className="min-w-0">
          {generated || generate.isPending ? (
            <>
              <DocumentEditor
                label="Proposal text"
                value={content}
                onChange={setContent}
                busy={generate.isPending}
                placeholder="Your proposal will appear here…"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyButton text={content} />
                <Button
                  onClick={onSave}
                  loading={save.isPending}
                  disabled={!generated || generate.isPending || !content.trim()}
                >
                  Save proposal
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              Fill in the project details and click <strong>Generate with AI</strong>. Your draft
              will appear here, ready to edit.
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
        Your proposal hasn't been saved. If you leave now, the draft is lost.
      </Modal>
    </>
  );
}
