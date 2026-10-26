import { complexityLabels, fromCents, urgencyLabels } from '@afa/shared';
import type { PriceBreakdown, PricingProjectInput } from '@afa/shared';
import { describeWriter, factRules, fence } from './common.ts';
import type { PromptSpec, WriterProfile } from './common.ts';

// Answer shape; checked on our side with pricingSuggestionSchema
const shape = `{
  "priceRange": { "low": number, "high": number },
  "deliveryDays": { "min": integer, "max": integer },
  "positioning": string,
  "tips": string[]
}`;

export function buildPricingPrompt(
  input: PricingProjectInput,
  price: PriceBreakdown,
  writer: WriterProfile,
): PromptSpec {
  const money = (cents: number) => `${fromCents(cents)} ${input.currency}`;

  const system = `You are an experienced freelance business coach. You help freelancers price client projects fairly and confidently.

Reply with one JSON object, and nothing else, in exactly this shape:
${shape}

"priceRange": a fair price range in ${input.currency} for this whole project, excluding tax, for a freelancer with the profile below. Whole numbers.
"deliveryDays": a realistic delivery window in calendar days, considering the hours and the urgency chosen.
"positioning": 2 to 4 sentences, addressed to the freelancer as "you", on how their calculated price compares with your range and why. Mention the main factors (scope, complexity, urgency, experience, location if known).
"tips": 3 to 5 short, practical tips to price or package this project better, e.g. deposits, milestones, a fixed price versus hourly, or what to include or charge extra for.

Rules:
${factRules}
- The range is your own estimate from general market knowledge. Never cite sources, platforms' data, surveys or statistics, and never claim certainty.
- If the project description is missing or vague, keep the range wider and say in "positioning" that a clearer scope would sharpen it.`;

  const extras = price.extras.length
    ? price.extras.map((e) => `- ${e.label}: ${money(e.amount)}`).join('\n')
    : 'none';

  const prompt = `Suggest pricing for this project.

The freelancer:
${fence('freelancer', describeWriter(writer))}

Project: ${fence('project', input.title)}
${input.description ? `Description:\n${fence('description', input.description)}\n` : 'Description: not given\n'}
The freelancer's own calculation:
- Hourly rate: ${input.hourlyRate} ${input.currency}, estimated hours: ${input.hours}
- Complexity: ${complexityLabels[input.complexity]}; urgency: ${urgencyLabels[input.urgency]}
- Extras:
${fence('extras', extras)}
- Price before tax: ${money(price.subtotal)}`;

  return { version: 'pricing.v1', system, prompt, maxOutputTokens: 1000, temperature: 0.4 };
}
