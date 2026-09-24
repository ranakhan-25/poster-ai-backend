import { describe, expect, it } from 'vitest';
import { registerSchema } from '../src/validators/auth.validator';
import { posterFormSchema } from '../src/validators/poster.validator';
import { aiLayoutSchema, parseAiLayout } from '../src/validators/aiLayout.validator';
import { assertCanRegenerate, assertOwner } from '../src/services/ownership';
import { buildPosterHtml, escapeHtml } from '../src/services/poster.service';
import { reconcileWithPhotos } from '../src/services/gemini.service';

const layout = { layout: 'three_photo', backgroundTheme: 'victory_day', headlinePosition: 'top_center',
  photoArrangement: 'center_large_two_small', accentColor: '#E31E24', secondaryColor: '#006A4E', decorations: ['dove'] } as const;

describe('auth validation', () => {
  it('rejects short passwords', () => expect(registerSchema.safeParse({ name: 'Ab', email: 'a@b.co', password: '1234567' }).success).toBe(false));
  it('accepts valid input', () => expect(registerSchema.safeParse({ name: 'Ab', email: 'A@B.co', password: '12345678' }).success).toBe(true));
});

describe('poster validation', () => {
  it('requires headline and name', () =>
    expect(posterFormSchema.safeParse({ templateId: '507f1f77bcf86cd799439011', headline: '', name: '' }).success).toBe(false));
  it('rejects bad template id', () =>
    expect(posterFormSchema.safeParse({ templateId: 'x', headline: 'বিজয়', name: 'রানা' }).success).toBe(false));
});

describe('gemini response validation', () => {
  it('parses fenced JSON', () => expect(parseAiLayout('```json\n' + JSON.stringify(layout) + '\n```').layout).toBe('three_photo'));
  it('rejects unknown decorations and bad colors', () => {
    expect(aiLayoutSchema.safeParse({ ...layout, decorations: ['<script>'] }).success).toBe(false);
    expect(aiLayoutSchema.safeParse({ ...layout, accentColor: 'red' }).success).toBe(false);
  });
  it('rejects non-JSON', () => expect(() => parseAiLayout('sorry')).toThrow());
  it('reconciles layout with photo count', () => expect(reconcileWithPhotos({ ...layout, decorations: [...layout.decorations] }, 1).layout).toBe('one_photo'));
});

describe('poster ownership & regeneration', () => {
  const p = { userId: { toString: () => 'u1' }, generationAttempts: 3, status: 'completed' };
  it('hides other users posters', () => expect(() => assertOwner(p, 'u2')).toThrow('Poster not found'));
  it('allows owner', () => expect(assertOwner(p, 'u1')).toBe(p));
  it('blocks after 3 attempts', () => expect(() => assertCanRegenerate(p)).toThrow('Maximum regeneration limit reached.'));
  it('allows under limit', () => expect(() => assertCanRegenerate({ ...p, generationAttempts: 2 })).not.toThrow());
});

describe('renderer HTML', () => {
  it('keeps exact Bangla text and escapes HTML', () => {
    const html = buildPosterHtml({ template: { titleBn: 'বিজয় দিবস' }, photos: [], aiLayout: { ...layout, decorations: [...layout.decorations] },
      formData: { headline: 'মহান <b>বিজয়</b>', name: 'রানা খান', footerCredit: 'বন্ধুরা' } });
    expect(html).toContain('রানা খান');
    expect(html).toContain('প্রচারে');
    expect(html).not.toContain('<b>বিজয়</b>');
    expect(escapeHtml('<&>')).toBe('&lt;&amp;&gt;');
  });
});
