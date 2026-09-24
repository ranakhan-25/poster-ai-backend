import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, hasGemini } from '../config/env';
import { AiLayout, aiLayoutSchema, parseAiLayout } from '../validators/aiLayout.validator';

export interface LayoutRequest {
  templateTitle: string;
  occasionType: string;
  photoCount: number;
  headline: string;
  fallback: AiLayout;
  attempt: number;
}

export function buildPrompt(r: LayoutRequest): string {
  return `You are a poster layout designer. Return ONLY a JSON object, no prose, no markdown.
Do NOT write any poster text. You only choose layout and decoration.
Context: template="${r.templateTitle}", occasion="${r.occasionType}", photos=${r.photoCount}, headlineLength=${r.headline.length}, variation=${r.attempt}.
Schema:
{"layout":"one_photo|two_photo|three_photo","backgroundTheme":"victory_day|green_red|mourning|campaign_bold|clean_light",
"headlinePosition":"top_center|top_left|center","photoArrangement":"single_center|two_side_by_side|center_large_two_small|three_portrait",
"accentColor":"#RRGGBB","secondaryColor":"#RRGGBB",
"decorations":["flag_ribbon|dove|flower|floral_border|candle|star_burst|shapla|geometric_frame"] (max 4)}
Rules: layout must match the photo count (${r.photoCount} => ${['one_photo', 'one_photo', 'two_photo', 'three_photo'][r.photoCount]}).
Tribute posters must be somber (no bright celebratory decorations). Colors must keep text readable.`;
}

/** Forces layout/arrangement to be consistent with the number of photos actually supplied. */
export function reconcileWithPhotos(l: AiLayout, photoCount: number): AiLayout {
  if (photoCount >= 3) return { ...l, layout: 'three_photo', photoArrangement: l.photoArrangement === 'three_portrait' ? 'three_portrait' : 'center_large_two_small' };
  if (photoCount === 2) return { ...l, layout: 'two_photo', photoArrangement: 'two_side_by_side' };
  return { ...l, layout: 'one_photo', photoArrangement: 'single_center' };
}

export async function generateLayout(r: LayoutRequest): Promise<{ layout: AiLayout; usedFallback: boolean }> {
  const fallback = reconcileWithPhotos(aiLayoutSchema.parse(r.fallback), r.photoCount);
  if (!hasGemini) return { layout: fallback, usedFallback: true };

  const model = new GoogleGenerativeAI(env.GEMINI_API_KEY as string).getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.6 + r.attempt * 0.1 },
  });

  for (let i = 0; i < 2; i++) {
    try {
      const res = await model.generateContent(buildPrompt(r));
      return { layout: reconcileWithPhotos(parseAiLayout(res.response.text()), r.photoCount), usedFallback: false };
    } catch (e) {
      console.warn(`Gemini attempt ${i + 1} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return { layout: fallback, usedFallback: true };
}
