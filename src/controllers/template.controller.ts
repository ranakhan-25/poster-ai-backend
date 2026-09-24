import { Request, Response } from 'express';
import { z } from 'zod';
import { OCCASIONS, Template } from '../models/Template';
import { AppError } from '../utils/errors';
import { objectIdSchema } from '../validators/poster.validator';

export async function listTemplates(req: Request, res: Response) {
  const { occasionType } = z.object({ occasionType: z.enum(OCCASIONS).optional() }).parse(req.query);
  const templates = await Template.find({ isActive: true, ...(occasionType ? { occasionType } : {}) }).sort({ createdAt: 1 });
  res.json({ success: true, data: { templates } });
}

export async function getTemplate(req: Request, res: Response) {
  const template = await Template.findOne({ _id: objectIdSchema.parse(req.params.id), isActive: true });
  if (!template) throw new AppError(404, 'Template not found');
  res.json({ success: true, data: { template } });
}
