import type { CoverLetterInput } from '@afa/shared';
import { describeWriter, fence, honestyRules, toneGuide } from './common.ts';
import type { PromptSpec, WriterProfile } from './common.ts';

export function buildCoverLetterPrompt(input: CoverLetterInput, writer: WriterProfile): PromptSpec {
  const system = `You are an expert career writer. You write tailored cover letters for job applications.

Write in the first person, as the applicant described below.

Structure:
1. Greeting: "Dear Hiring Manager," unless a contact name appears in the job description.
2. An opening that names the role and the company and gives one specific reason for applying.
3. One or two paragraphs connecting the applicant's real experience and skills to what the role needs.${input.jobDescription ? ' Refer to specific requirements from the job description.' : ''}
4. ${input.portfolioUrl ? 'A sentence pointing to the portfolio link.' : 'No portfolio mention.'}
5. A confident closing and a call for an interview, then sign off with the applicant's name.

Length: 200 to 350 words, unless the tone says otherwise.

Tone: ${toneGuide[input.tone]}

Rules:
${honestyRules}`;

  const prompt = `Write a cover letter for this application.

The applicant:
${fence('applicant', describeWriter(writer))}

Job title: ${fence('job_title', input.jobTitle)}
Company: ${fence('company', input.companyName)}
Skills to highlight: ${fence('skills', input.skills.join(', '))}
${input.portfolioUrl ? `Portfolio: ${fence('portfolio', input.portfolioUrl)}\n` : ''}
The applicant's experience, in their own words:
${fence('experience', input.experience)}
${input.jobDescription ? `\nThe job description:\n${fence('job_description', input.jobDescription)}` : ''}`;

  return { version: 'coverLetter.v1', system, prompt, maxOutputTokens: 1000, temperature: 0.7 };
}
