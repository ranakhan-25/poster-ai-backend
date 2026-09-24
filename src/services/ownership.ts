import { AppError } from "../utils/errors";

export const MAX_ATTEMPTS = 3;

/** Returns 404 (not 403) so poster ids can't be probed for existence. */
export function assertOwner<T extends { userId: { toString(): string } }>(
  poster: T | null,
  userId: string,
): T {
  if (!poster || poster.userId.toString() !== userId)
    throw new AppError(404, "Poster not found");
  return poster;
}

export function assertCanRegenerate(poster: {
  generationAttempts: number;
  status: string;
}) {
  if (poster.status === "generating")
    throw new AppError(409, "Poster is already being generated");
  if (poster.generationAttempts >= MAX_ATTEMPTS)
    throw new AppError(400, "Maximum regeneration limit reached.");
}
