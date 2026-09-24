import { v2 as cloudinary } from 'cloudinary';
import { env, hasCloudinary } from '../config/env';

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET, secure: true,
  });
}

/**
 * Uploads a buffer. Without Cloudinary credentials (local dev) it falls back to a
 * data URL so the full pipeline still works offline. Do not use mock mode in production.
 */
export async function uploadBuffer(buf: Buffer, folder: string, mime = 'image/png'): Promise<string> {
  if (!hasCloudinary) return `data:${mime};base64,${buf.toString('base64')}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `poster-ai/${folder}`, resource_type: 'image' }, (err, r) =>
        err || !r ? reject(err ?? new Error('Upload failed')) : resolve(r.secure_url))
      .end(buf);
  });
}
