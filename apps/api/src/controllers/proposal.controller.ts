import type { RequestHandler } from 'express';
import { listQuerySchema } from '@afa/shared';
import { authUser } from '../middleware/requireAuth.ts';
import * as proposalService from '../services/proposal.service.ts';

type IdParams = { id: string };

export const generate: RequestHandler = async (req, res) => {
  const draft = await proposalService.generateProposal(authUser(req).id, req.body);
  res.json({ data: { draft } });
};

export const create: RequestHandler = async (req, res) => {
  const proposal = await proposalService.createProposal(authUser(req).id, req.body);
  res.status(201).json({ data: { proposal } });
};

export const list: RequestHandler = async (req, res) => {
  // req.query is read-only in Express 5, so it's parsed here rather than by validate()
  const result = await proposalService.listProposals(
    authUser(req).id,
    listQuerySchema.parse(req.query),
  );
  res.json({ data: result });
};

export const get: RequestHandler<IdParams> = async (req, res) => {
  const proposal = await proposalService.getProposal(authUser(req).id, req.params.id);
  res.json({ data: { proposal } });
};

export const update: RequestHandler<IdParams> = async (req, res) => {
  const proposal = await proposalService.updateProposal(authUser(req).id, req.params.id, req.body);
  res.json({ data: { proposal } });
};

export const remove: RequestHandler<IdParams> = async (req, res) => {
  await proposalService.deleteProposal(authUser(req).id, req.params.id);
  res.status(204).end();
};
