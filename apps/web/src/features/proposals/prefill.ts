// Values another page hands to "New proposal" through the navigation state,
// e.g. "Use this price" on a saved estimate. Nothing is saved until the user does.
export type ProposalPrefill = {
  projectTitle?: string;
  projectDescription?: string;
  budget?: string;
  timeline?: string;
  // Shown in a note so the user knows where the values came from
  source: string;
};

export const readProposalPrefill = (state: unknown): ProposalPrefill | null =>
  (state as { proposalPrefill?: ProposalPrefill } | null)?.proposalPrefill ?? null;
