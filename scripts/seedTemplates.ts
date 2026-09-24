import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Template } from '../src/models/Template';

const templates = [
  { title: 'Victory Day', titleBn: 'বিজয় দিবস', occasionType: 'victory_day',
    layoutConfig: { layout: 'three_photo', backgroundTheme: 'victory_day', headlinePosition: 'top_center',
      photoArrangement: 'center_large_two_small', accentColor: '#E31E24', secondaryColor: '#006A4E',
      decorations: ['flag_ribbon', 'dove', 'flower'] },
    colors: { background: '#006A4E', text: '#FFFFFF', muted: '#CDE8DF' },
    photoSlots: { min: 0, max: 3 }, headlineConfig: { defaultText: 'মহান বিজয় দিবসের শুভেচ্ছা', fontSize: 96 } },
  { title: 'Tribute', titleBn: 'শোক ও স্মরণ', occasionType: 'tribute',
    layoutConfig: { layout: 'one_photo', backgroundTheme: 'mourning', headlinePosition: 'top_center',
      photoArrangement: 'single_center', accentColor: '#9CA3AF', secondaryColor: '#F3F4F6',
      decorations: ['candle', 'geometric_frame'] },
    colors: { background: '#111111', text: '#FFFFFF', muted: '#9CA3AF' },
    photoSlots: { min: 1, max: 1 }, headlineConfig: { defaultText: 'গভীর শোক ও শ্রদ্ধাঞ্জলি', fontSize: 88 } },
  { title: 'Campaign', titleBn: 'নির্বাচনী প্রচার', occasionType: 'campaign',
    layoutConfig: { layout: 'two_photo', backgroundTheme: 'campaign_bold', headlinePosition: 'top_left',
      photoArrangement: 'two_side_by_side', accentColor: '#E31E24', secondaryColor: '#006A4E',
      decorations: ['star_burst', 'floral_border'] },
    colors: { background: '#FFF7F0', text: '#14201C', muted: '#5B6B66' },
    photoSlots: { min: 0, max: 3 }, headlineConfig: { defaultText: 'আপনার মূল্যবান ভোট দিন', fontSize: 92 } },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  for (const t of templates) await Template.updateOne({ occasionType: t.occasionType }, { $set: t }, { upsert: true });
  console.log(`Seeded ${templates.length} templates`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
