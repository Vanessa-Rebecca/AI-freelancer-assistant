import type { ProposalInput } from '@afa/shared';
import { describeWriter, fence, honestyRules, toneGuide } from './common.ts';
import type { PromptSpec, WriterProfile } from './common.ts';

export function buildProposalPrompt(input: ProposalInput, writer: WriterProfile): PromptSpec {
  const system = `You are an expert freelance proposal writer. You write winning proposals that a freelancer sends to a client for a specific project.

Write in the first person, as the freelancer described below, addressed to the client by name.

Structure:
1. A one or two sentence opening that shows you understand the client's goal (do not start with "I am writing to").
2. Your understanding of the project and its main challenge.
3. Your approach: the concrete steps or deliverables you propose.
4. Why you are a good fit, using only the freelancer's real skills and details.
5. Timeline and budget, using exactly the figures given.
6. A short call to action, then sign off with the freelancer's name.

Length: 220 to 380 words, unless the tone says otherwise.

Tone: ${toneGuide[input.tone]}

Rules:
${honestyRules}`;

  const prompt = `Write a proposal for this project.

The freelancer:
${fence('freelancer', describeWriter(writer))}

The client: ${fence('client_name', input.clientName)}
Project title: ${fence('project_title', input.projectTitle)}
Skills to highlight: ${fence('skills', input.skills.join(', '))}
Proposed budget: ${fence('budget', input.budget)}
Proposed timeline: ${fence('timeline', input.timeline)}

The client's project description:
${fence('client_brief', input.projectDescription)}`;

  return { version: 'proposal.v1', system, prompt, maxOutputTokens: 1200, temperature: 0.7 };
}
