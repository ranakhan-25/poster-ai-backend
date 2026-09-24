import puppeteer, { Browser } from 'puppeteer';
import { env } from '../config/env';
import { AiLayout } from '../validators/aiLayout.validator';

export interface RenderInput {
  template: { titleBn: string; colors?: { background?: string | null; text?: string | null; muted?: string | null } | null; footerConfig?: { label?: string | null } | null };
  formData: { headline: string; name: string; designation?: string; party?: string; organization?: string; district?: string; upazila?: string; footerCredit?: string };
  photos: string[];
  aiLayout: AiLayout;
}

export const POSTER_WIDTH = 1200;
export const POSTER_HEIGHT = 1600;

export const escapeHtml = (s = ''): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const DECOR: Record<string, string> = {
  flag_ribbon: '<div class="d ribbon"></div>',
  dove: '<div class="d dove">🕊</div>',
  flower: '<div class="d flower">✿</div>',
  floral_border: '<div class="d border"></div>',
  candle: '<div class="d candle">🕯</div>',
  star_burst: '<div class="d star">✦</div>',
  shapla: '<div class="d shapla">❀</div>',
  geometric_frame: '<div class="d frame"></div>',
};

const BG: Record<AiLayout['backgroundTheme'], string> = {
  victory_day: 'linear-gradient(160deg,#0b3d2e 0%,#006a4e 55%,#0b3d2e 100%)',
  green_red: 'linear-gradient(160deg,#00503a 0%,#006a4e 60%,#7a0f14 100%)',
  mourning: 'linear-gradient(180deg,#111 0%,#26262b 100%)',
  campaign_bold: 'linear-gradient(160deg,#fff7f0 0%,#ffe1d6 100%)',
  clean_light: 'linear-gradient(180deg,#ffffff 0%,#f1f5f4 100%)',
};

const LIGHT_BG = new Set(['campaign_bold', 'clean_light']);

function photoGrid(photos: string[], arr: AiLayout['photoArrangement'], accent: string): string {
  const img = (src: string, cls: string) => `<div class="ph ${cls}" style="border-color:${accent}"><img src="${escapeHtml(src)}" alt=""/></div>`;
  if (!photos.length) return '';
  if (photos.length === 1) return `<div class="grid g1">${img(photos[0]!, 'a')}</div>`;
  if (photos.length === 2) return `<div class="grid g2">${photos.map((p, i) => img(p, i ? 'b' : 'a')).join('')}</div>`;
  if (arr === 'three_portrait') return `<div class="grid g3p">${photos.slice(0, 3).map((p) => img(p, 'a')).join('')}</div>`;
  return `<div class="grid g3">${img(photos[0]!, 'main')}${img(photos[1]!, 'sm1')}${img(photos[2]!, 'sm2')}</div>`;
}

export function buildPosterHtml({ template, formData: f, photos, aiLayout: l }: RenderInput): string {
  const light = LIGHT_BG.has(l.backgroundTheme);
  const text = light ? '#14201c' : '#ffffff';
  const align = l.headlinePosition === 'top_left' ? 'left' : 'center';
  const meta = [f.designation, f.party, f.organization].filter(Boolean).map((s) => escapeHtml(s)).join(' • ');
  const loc = [f.upazila, f.district].filter(Boolean).map((s) => escapeHtml(s)).join(', ');
  const credit = f.footerCredit ? `${escapeHtml(template.footerConfig?.label || 'প্রচারে')}: ${escapeHtml(f.footerCredit)}` : '';
  const hl = f.headline.length > 60 ? 64 : f.headline.length > 30 ? 80 : 96;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;800&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:${POSTER_WIDTH}px;height:${POSTER_HEIGHT}px;font-family:'Noto Sans Bengali','Noto Sans','Hind Siliguri',sans-serif;color:${text}}
.poster{position:relative;width:100%;height:100%;background:${BG[l.backgroundTheme]};overflow:hidden;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.top{text-align:${align};z-index:2;${l.headlinePosition === 'center' ? 'margin-top:120px;' : ''}}
.kicker{display:inline-block;background:${l.accentColor};color:#fff;padding:8px 28px;border-radius:999px;font-size:30px;font-weight:600;margin-bottom:28px}
h1{font-size:${hl}px;line-height:1.3;font-weight:800;word-break:break-word}
.mid{z-index:2;display:flex;justify-content:center}
.grid{display:grid;gap:24px;width:100%}
.g1{grid-template-columns:1fr;justify-items:center}.g1 .ph{width:720px;height:760px}
.g2{grid-template-columns:1fr 1fr}.g2 .ph{height:700px}
.g3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;height:780px}.g3 .main{grid-row:1/3}
.g3p{grid-template-columns:repeat(3,1fr)}.g3p .ph{height:680px}
.ph{border:8px solid;border-radius:24px;overflow:hidden;background:#0002;box-shadow:0 20px 40px #0006}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.bottom{z-index:2;text-align:center;background:${light ? '#ffffffcc' : '#00000055'};border-top:6px solid ${l.accentColor};border-radius:20px;padding:28px 36px}
.name{font-size:64px;font-weight:800}.meta{font-size:34px;margin-top:8px;opacity:.95}.loc{font-size:30px;margin-top:6px;opacity:.85}
.credit{margin-top:18px;font-size:26px;color:${l.secondaryColor === l.accentColor ? text : light ? l.secondaryColor : '#fff'};opacity:.9}
.d{position:absolute;z-index:1;pointer-events:none}
.ribbon{top:0;left:0;right:0;height:22px;background:linear-gradient(90deg,${l.accentColor} 50%,${l.secondaryColor} 50%)}
.dove{top:210px;right:70px;font-size:120px;opacity:.85}.flower{bottom:420px;left:40px;font-size:110px;color:${l.accentColor};opacity:.6}
.candle{bottom:430px;right:50px;font-size:110px}.star{top:150px;left:50px;font-size:100px;color:${l.accentColor};opacity:.7}
.shapla{bottom:440px;right:50px;font-size:110px;opacity:.6}
.border{inset:20px;border:6px double ${l.accentColor};border-radius:28px;opacity:.7}
.frame{inset:36px;border:3px solid ${l.secondaryColor};opacity:.8}
</style></head><body><div class="poster">
${l.decorations.map((d) => DECOR[d] ?? '').join('')}
<div class="top"><div class="kicker">${escapeHtml(template.titleBn)}</div><h1>${escapeHtml(f.headline)}</h1></div>
<div class="mid">${photoGrid(photos, l.photoArrangement, l.accentColor)}</div>
<div class="bottom"><div class="name">${escapeHtml(f.name)}</div>${meta ? `<div class="meta">${meta}</div>` : ''}${loc ? `<div class="loc">${loc}</div>` : ''}${credit ? `<div class="credit">${credit}</div>` : ''}</div>
</div></body></html>`;
}

let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  browserPromise ??= puppeteer.launch({
    headless: true,
    executablePath: env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return browserPromise;
}

export async function renderPoster(input: RenderInput): Promise<Buffer> {
  const page = await (await getBrowser()).newPage();
  try {
    await page.setViewport({ width: POSTER_WIDTH, height: POSTER_HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(buildPosterHtml(input), { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    return Buffer.from(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: POSTER_WIDTH, height: POSTER_HEIGHT } }));
  } catch (e) {
    browserPromise = null; // relaunch on next request if the browser died
    throw e;
  } finally {
    await page.close().catch(() => undefined);
  }
}
