import { z } from 'zod';
import { Types } from 'mongoose';

const opt = (max: number) => z.string().trim().max(max).optional().default('');

export const posterFormSchema = z.object({
  templateId: z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid template id'),
  headline: z.string().trim().min(2, 'Headline is required').max(140),
  name: z.string().trim().min(2, 'Name is required').max(80),
  designation: opt(100),
  party: opt(100),
  organization: opt(100),
  district: opt(60),
  upazila: opt(60),
  footerCredit: opt(120),
});
export type PosterForm = z.infer<typeof posterFormSchema>;

export const objectIdSchema = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');
