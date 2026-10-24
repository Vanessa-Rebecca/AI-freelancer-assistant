import type { Tone } from '../schemas/writing.ts';

export type CoverLetter = {
  id: string;
  jobTitle: string;
  companyName: string;
  experience: string;
  skills: string[];
  portfolioUrl: string | null;
  jobDescription: string | null;
  tone: Tone;
  content: string;
  promptVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoverLetterSummary = Pick<
  CoverLetter,
  'id' | 'jobTitle' | 'companyName' | 'tone' | 'createdAt' | 'updatedAt'
> & { preview: string };
