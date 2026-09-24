import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create Access Token
const signAccessToken = (id: string, role: string) =>
  jwt.sign(
    {
      role,
      type: "access",
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: id,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions,
  );

// Create Refresh Token
const signRefreshToken = (id: string) =>
  jwt.sign(
    {
      type: "refresh",
    },
    env.JWT_REFRESH_SECRET,
    {
      subject: id,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions,
  );

// Return safe public user data
const publicUser = (u: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
}) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

// Set Access + Refresh Token cookies
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });
};

// Clear Access + Refresh Token cookies
const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

// Register
export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const accessToken = signAccessToken(String(user._id), user.role);

  const refreshToken = signRefreshToken(String(user._id));

  setAuthCookies(res, accessToken, refreshToken);

  return res.status(201).json({
    success: true,
    data: {
      user: publicUser(user),
    },
  });
}

// Login
export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = signAccessToken(String(user._id), user.role);

  const refreshToken = signRefreshToken(String(user._id));

  setAuthCookies(res, accessToken, refreshToken);

  return res.json({
    success: true,
    data: {
      user: publicUser(user),
    },
  });
}

// Refresh Access Token
export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new AppError(401, "Refresh token not found");
  }

  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    ) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  if (payload.type !== "refresh" || !payload.sub) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new AppError(401, "Account not found");
  }

  const newAccessToken = signAccessToken(String(user._id), user.role);

  // Only replace Access Token.
  // Refresh Token remains valid until it expires.
  res.cookie(ACCESS_COOKIE_NAME, newAccessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  return res.json({
    success: true,
    data: {
      user: publicUser(user),
    },
  });
}

// Current logged-in user
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError(401, "Account not found");
  }

  return res.json({
    success: true,
    data: {
      user: publicUser(user),
    },
  });
}

// Logout
export async function logout(req: Request, res: Response) {
  clearAuthCookies(res);

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}
