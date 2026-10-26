import type { RequestHandler } from 'express';
import { listQuerySchema } from '@afa/shared';
import { authUser } from '../middleware/requireAuth.ts';
import * as pricingService from '../services/pricing.service.ts';

type IdParams = { id: string };

export const calculate: RequestHandler = (req, res) => {
  res.json({ data: { breakdown: pricingService.calculate(req.body) } });
};

export const suggest: RequestHandler = async (req, res) => {
  const result = await pricingService.suggest(authUser(req).id, req.body);
  res.json({ data: result });
};

export const create: RequestHandler = async (req, res) => {
  const estimate = await pricingService.saveEstimate(authUser(req).id, req.body);
  res.status(201).json({ data: { estimate } });
};

export const history: RequestHandler = async (req, res) => {
  const result = await pricingService.listEstimates(
    authUser(req).id,
    listQuerySchema.parse(req.query),
  );
  res.json({ data: result });
};

export const get: RequestHandler<IdParams> = async (req, res) => {
  const estimate = await pricingService.getEstimate(authUser(req).id, req.params.id);
  res.json({ data: { estimate } });
};

export const remove: RequestHandler<IdParams> = async (req, res) => {
  await pricingService.deleteEstimate(authUser(req).id, req.params.id);
  res.status(204).end();
};
