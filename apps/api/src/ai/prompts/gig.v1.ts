import { experienceLevelLabels } from '@afa/shared';
import type { ExperienceLevel, GigInput } from '@afa/shared';
import { describeWriter, factRules, fence } from './common.ts';
import type { PromptSpec, WriterProfile } from './common.ts';

// How to sound at each level without inventing credentials
const levelGuide: Record<ExperienceLevel, string> = {
  BEGINNER:
    'Beginner: eager and reliable. Sell care, communication and fast replies, not a long track record.',
  INTERMEDIATE: 'Intermediate: capable and dependable. Sell a clear process and solid results.',
  EXPERT:
    'Expert: authoritative and calm. Sell judgement, quality and handling complex work, without boasting.',
};

// Answer shape; checked on our side with gigContentSchema
const shape = `{
  "description": string,
  "seoKeywords": string[],
  "faqs": [{ "question": string, "answer": string }]
}`;

export function buildGigPrompt(input: GigInput, writer: WriterProfile): PromptSpec {
  const system = `You are an expert copywriter for freelance marketplaces such as Fiverr and Upwork. You write gig descriptions that rank well in search and convert visitors into buyers.

Reply with one JSON object, and nothing else, in exactly this shape:
${shape}

"description":
- Written in the first person, as the seller described below.
- Open with the buyer's problem or goal, then what the seller delivers.
- List the included features as "-" bullet points, then delivery time and revisions.
- End with a short call to message or order.
- Plain text with line breaks (\\n). No markdown headings, no bold, no emojis.
- At most 1200 characters in total (the Fiverr limit).

"seoKeywords": 8 to 12 short search phrases a buyer would type, lowercase, most relevant first. No hashtags.

"faqs": 4 to 6 questions buyers really ask about this kind of service (process, what is needed to start, revisions, delivery, extras), each with a short, helpful answer consistent with the details below.

Experience level: ${levelGuide[input.experienceLevel]}

Rules:
${factRules}
- Promise only the features, delivery time and revisions listed. Do not add extras, guarantees or prices.`;

  const prompt = `Write a gig for this service.

The seller:
${fence('seller', describeWriter(writer))}

Category: ${fence('category', input.category)}
Skills: ${fence('skills', input.skills.join(', '))}
Experience level: ${experienceLevelLabels[input.experienceLevel]}
Delivery time: ${input.deliveryDays} ${input.deliveryDays === 1 ? 'day' : 'days'}
Revisions included: ${input.revisions === 0 ? 'none' : input.revisions}

Features included, one per line:
${fence('features', input.features.join('\n'))}`;

  return { version: 'gig.v1', system, prompt, maxOutputTokens: 1500, temperature: 0.7 };
}
