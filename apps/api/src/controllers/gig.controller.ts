import type { RequestHandler } from 'express';
import { listQuerySchema } from '@afa/shared';
import { authUser } from '../middleware/requireAuth.ts';
import * as gigService from '../services/gig.service.ts';

type IdParams = { id: string };

export const generate: RequestHandler = async (req, res) => {
  const draft = await gigService.generateGig(authUser(req).id, req.body);
  res.json({ data: { draft } });
};

export const create: RequestHandler = async (req, res) => {
  const gig = await gigService.createGig(authUser(req).id, req.body);
  res.status(201).json({ data: { gig } });
};

export const list: RequestHandler = async (req, res) => {
  const result = await gigService.listGigs(authUser(req).id, listQuerySchema.parse(req.query));
  res.json({ data: result });
};

export const get: RequestHandler<IdParams> = async (req, res) => {
  const gig = await gigService.getGig(authUser(req).id, req.params.id);
  res.json({ data: { gig } });
};

export const update: RequestHandler<IdParams> = async (req, res) => {
  const gig = await gigService.updateGig(authUser(req).id, req.params.id, req.body);
  res.json({ data: { gig } });
};

export const remove: RequestHandler<IdParams> = async (req, res) => {
  await gigService.deleteGig(authUser(req).id, req.params.id);
  res.status(204).end();
};
