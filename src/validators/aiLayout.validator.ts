import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const LAYOUTS = ['one_photo', 'two_photo', 'three_photo'] as const;
export const DECORATIONS = [
  'flag_ribbon', 'dove', 'flower', 'floral_border', 'candle', 'star_burst', 'shapla', 'geometric_frame',
] as const;

export const aiLayoutSchema = z.object({
  layout: z.enum(LAYOUTS),
  backgroundTheme: z.enum(['victory_day', 'green_red', 'mourning', 'campaign_bold', 'clean_light']),
  headlinePosition: z.enum(['top_center', 'top_left', 'center']),
  photoArrangement: z.enum([
    'single_center', 'two_side_by_side', 'center_large_two_small', 'three_portrait',
  ]),
  accentColor: hex,
  secondaryColor: hex,
  decorations: z.array(z.enum(DECORATIONS)).max(4),
});
export type AiLayout = z.infer<typeof aiLayoutSchema>;

/** Extract JSON from model text (handles ```json fences) and validate strictly. */
export function parseAiLayout(raw: string): AiLayout {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON object in AI response');
  return aiLayoutSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
}
