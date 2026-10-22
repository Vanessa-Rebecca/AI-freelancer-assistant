import type { ProposalInput } from '@afa/shared';
import { buildProposalPrompt } from '../ai/prompts/proposal.v1.ts';
import * as ai from './ai.service.ts';
import { getWriterProfile } from './writer-profile.service.ts';

// Returns a draft only. Nothing is saved until the user edits and saves it.
export async function generateProposal(userId: string, input: ProposalInput) {
  const writer = await getWriterProfile(userId);
  const spec = buildProposalPrompt(input, writer);

  const result = await ai.generate(userId, 'PROPOSAL', spec);

  return {
    content: result.text.trim(),
    promptVersion: spec.version,
    model: result.model,
    creditsUsed: result.creditsUsed,
    creditsRemaining: result.creditsRemaining,
    // The model hit its length limit: the UI should offer to regenerate
    truncated: result.finishReason === 'MAX_TOKENS',
  };
}
