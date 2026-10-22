import type { Tone } from '../schemas/writing.ts';

export type Proposal = {
  id: string;
  clientId: string | null;
  clientName: string;
  projectTitle: string;
  projectDescription: string;
  skills: string[];
  budget: string;
  timeline: string;
  tone: Tone;
  content: string;
  promptVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

// A row in the history list: no full text, just a preview
export type ProposalSummary = Pick<
  Proposal,
  'id' | 'clientName' | 'projectTitle' | 'tone' | 'createdAt' | 'updatedAt'
> & { preview: string };

export type ProposalDraft = {
  content: string;
  promptVersion: string;
  model: string;
  creditsUsed: number;
  creditsRemaining: number;
  truncated: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
