import type { RequestHandler } from 'express';
import { authUser } from '../middleware/requireAuth.ts';
import * as proposalService from '../services/proposal.service.ts';

export const generate: RequestHandler = async (req, res) => {
  const draft = await proposalService.generateProposal(authUser(req).id, req.body);
  res.json({ data: { draft } });
};
