import multer from 'multer';
import { AppError } from '../utils/errors';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new AppError(400, 'Only JPG, PNG or WEBP images are allowed')),
}).array('photos', 3);

/** Verify magic bytes so a renamed file can't slip past the MIME check. */
export function hasImageSignature(buf: Buffer): boolean {
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}
