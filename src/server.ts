import mongoose from 'mongoose';
import { createApp } from './app';
import { env, hasCloudinary, hasGemini } from './config/env';

async function main() {
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(env.MONGODB_URI);
  createApp().listen(env.PORT, () => {
    console.log(`API on :${env.PORT} | gemini=${hasGemini ? 'on' : 'fallback'} | cloudinary=${hasCloudinary ? 'on' : 'mock'}`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
