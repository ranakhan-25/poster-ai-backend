import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../utils/errors";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Prefer the HttpOnly access-token cookie.
  // Keep Bearer token support as a fallback for API clients.
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return next(new AppError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
    ) as jwt.JwtPayload & {
      sub?: string;
      role?: string;
      type?: string;
    };

    // Make sure this is an access token, not a refresh token.
    if (payload.type !== "access") {
      return next(new AppError(401, "Invalid access token"));
    }

    if (!payload.sub || !payload.role) {
      return next(new AppError(401, "Invalid access token"));
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}
