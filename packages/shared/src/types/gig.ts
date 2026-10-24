import type { ExperienceLevel, GigContent, GigFaq } from '../schemas/writing.ts';

export type GigDescription = {
  id: string;
  category: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  deliveryDays: number;
  features: string[];
  revisions: number;
  description: string;
  seoKeywords: string[];
  faqs: GigFaq[];
  promptVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GigSummary = Pick<
  GigDescription,
  'id' | 'category' | 'experienceLevel' | 'deliveryDays' | 'createdAt' | 'updatedAt'
> & { preview: string };

// What /gigs/generate returns: editable sections, not yet saved
export type GeneratedGig = GigContent & {
  promptVersion: string;
  model: string;
  creditsUsed: number;
  creditsRemaining: number;
};
