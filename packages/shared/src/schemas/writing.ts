import { z } from 'zod';

export const TONES = ['PROFESSIONAL', 'FRIENDLY', 'PERSUASIVE', 'FORMAL', 'CONCISE'] as const;
export type Tone = (typeof TONES)[number];

export const toneLabels: Record<Tone, string> = {
  PROFESSIONAL: 'Professional',
  FRIENDLY: 'Friendly',
  PERSUASIVE: 'Persuasive',
  FORMAL: 'Formal',
  CONCISE: 'Concise',
};

export const toneSchema = z.enum(TONES, 'Choose a tone');

// Required text with a "required" message for empty input and a length cap
const text = (label: string, max: number) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((v) => v || undefined);

// Comma-separated text from a form, or an array from the API
export const skillsSchema = z
  .union([z.array(z.string()), z.string()], 'Add at least one skill')
  .transform((v) => (Array.isArray(v) ? v : v.split(',')))
  .pipe(
    z
      .array(
        z
          .string()
          .trim()
          .max(40, 'Each skill must be at most 40 characters. Separate skills with commas'),
      )
      .transform((list) => [...new Set(list.filter(Boolean))])
      .pipe(z.array(z.string()).min(1, 'Add at least one skill').max(20, 'Add at most 20 skills')),
  );

export const proposalInputSchema = z.object({
  clientName: text('Client name', 100),
  projectTitle: text('Project title', 150),
  projectDescription: text('Project description', 5000).pipe(
    z.string().min(30, 'Describe the project in at least 30 characters'),
  ),
  skills: skillsSchema,
  budget: text('Budget', 60),
  timeline: text('Timeline', 60),
  tone: toneSchema,
});

export const coverLetterInputSchema = z.object({
  jobTitle: text('Job title', 150),
  companyName: text('Company name', 100),
  experience: text('Experience', 3000).pipe(
    z.string().min(20, 'Describe your experience in at least 20 characters'),
  ),
  skills: skillsSchema,
  portfolioUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.url('Enter a valid URL, e.g. https://yoursite.com').optional()),
  jobDescription: optionalText('Job description', 5000),
  tone: toneSchema,
});

export const EXPERIENCE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

// One feature per line from a textarea (features often contain commas), or an array from the API
export const featuresSchema = z
  .union([z.array(z.string()), z.string()], 'Add at least one feature')
  .transform((v) => (Array.isArray(v) ? v : v.split('\n')))
  .pipe(
    z
      .array(
        z
          .string()
          .trim()
          .max(120, 'Each feature must be at most 120 characters. Put one feature per line'),
      )
      .transform((list) => [...new Set(list.filter(Boolean))])
      .pipe(
        z.array(z.string()).min(1, 'Add at least one feature').max(15, 'Add at most 15 features'),
      ),
  );

// Form values arrive as strings, so numbers are coerced ("" becomes 0)
export const gigInputSchema = z.object({
  category: text('Category', 80),
  skills: skillsSchema,
  experienceLevel: z.enum(EXPERIENCE_LEVELS, 'Choose an experience level'),
  deliveryDays: z.coerce
    .number('Enter the delivery time in days')
    .int('Use whole days')
    .min(1, 'Delivery time must be at least 1 day')
    .max(90, 'Delivery time must be at most 90 days'),
  features: featuresSchema,
  revisions: z.coerce
    .number('Enter the number of revisions')
    .int('Use a whole number')
    .min(0, 'Revisions cannot be negative')
    .max(20, 'Offer at most 20 revisions'),
});

// The generated (and later user-edited) gig content. The AI must return exactly this shape.
export const gigContentSchema = z.object({
  description: text('Description', 3000).pipe(
    z.string().min(50, 'Write a description of at least 50 characters'),
  ),
  seoKeywords: z
    .array(z.string().trim().toLowerCase().max(60, 'Each keyword must be at most 60 characters'))
    .transform((list) => [...new Set(list.filter(Boolean))])
    .pipe(z.array(z.string()).min(3, 'Add at least 3 keywords').max(15, 'Add at most 15 keywords')),
  faqs: z
    .array(
      z.object({
        question: text('Question', 300),
        answer: text('Answer', 1500),
      }),
    )
    .min(1, 'Add at least one FAQ')
    .max(10, 'Add at most 10 FAQs'),
});

export type GigInput = z.infer<typeof gigInputSchema>;
export type GigContent = z.infer<typeof gigContentSchema>;
export type GigFaq = GigContent['faqs'][number];

export type ProposalInput = z.infer<typeof proposalInputSchema>;
export type CoverLetterInput = z.infer<typeof coverLetterInputSchema>;

// Saving a draft: the inputs it was generated from, plus the (possibly edited) text
export const proposalSaveSchema = proposalInputSchema.extend({
  content: text('Proposal text', 20_000),
  promptVersion: z.string().trim().max(40).optional(),
});

// Editing: any subset of the saved fields, but not nothing
export const proposalUpdateSchema = proposalSaveSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type ProposalSaveInput = z.infer<typeof proposalSaveSchema>;
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;

export const coverLetterSaveSchema = coverLetterInputSchema.extend({
  content: text('Cover letter text', 20_000),
  promptVersion: z.string().trim().max(40).optional(),
});

export const coverLetterUpdateSchema = coverLetterSaveSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export type CoverLetterSaveInput = z.infer<typeof coverLetterSaveSchema>;
export type CoverLetterUpdateInput = z.infer<typeof coverLetterUpdateSchema>;
