import { Schema, model } from 'mongoose';

export const OCCASIONS = ['victory_day', 'tribute', 'campaign'] as const;

const templateSchema = new Schema({
  title: { type: String, required: true },
  titleBn: { type: String, required: true },
  occasionType: { type: String, enum: OCCASIONS, required: true, index: true },
  thumbnailUrl: { type: String, default: '' },
  layoutConfig: {
    layout: { type: String, required: true },
    backgroundTheme: { type: String, required: true },
    headlinePosition: { type: String, required: true },
    photoArrangement: { type: String, required: true },
    accentColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    decorations: [String],
  },
  colors: { background: String, text: String, muted: String },
  photoSlots: { min: Number, max: Number },
  headlineConfig: { defaultText: String, fontSize: Number },
  footerConfig: { label: { type: String, default: 'প্রচারে' } },
  isActive: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
});
export const Template = model('Template', templateSchema);
