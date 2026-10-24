import type { RequestHandler } from 'express';
import { listQuerySchema } from '@afa/shared';
import { authUser } from '../middleware/requireAuth.ts';
import * as coverLetterService from '../services/cover-letter.service.ts';

type IdParams = { id: string };

export const generate: RequestHandler = async (req, res) => {
  const draft = await coverLetterService.generateCoverLetter(authUser(req).id, req.body);
  res.json({ data: { draft } });
};

export const create: RequestHandler = async (req, res) => {
  const coverLetter = await coverLetterService.createCoverLetter(authUser(req).id, req.body);
  res.status(201).json({ data: { coverLetter } });
};

export const list: RequestHandler = async (req, res) => {
  const result = await coverLetterService.listCoverLetters(
    authUser(req).id,
    listQuerySchema.parse(req.query),
  );
  res.json({ data: result });
};

export const get: RequestHandler<IdParams> = async (req, res) => {
  const coverLetter = await coverLetterService.getCoverLetter(authUser(req).id, req.params.id);
  res.json({ data: { coverLetter } });
};

export const update: RequestHandler<IdParams> = async (req, res) => {
  const coverLetter = await coverLetterService.updateCoverLetter(
    authUser(req).id,
    req.params.id,
    req.body,
  );
  res.json({ data: { coverLetter } });
};

export const remove: RequestHandler<IdParams> = async (req, res) => {
  await coverLetterService.deleteCoverLetter(authUser(req).id, req.params.id);
  res.status(204).end();
};
