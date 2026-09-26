import { Router } from "express";
import { asyncHandler } from "../utils/errors";
import { requireAuth } from "../middleware/auth";
import { authLimiter, generationLimiter } from "../middleware/rateLimit";
import { photoUpload } from "../middleware/upload";
import * as auth from "../controllers/auth.controller";
import * as tpl from "../controllers/template.controller";
import * as poster from "../controllers/poster.controller";

export const router = Router();

router.post("/auth/register", authLimiter, asyncHandler(auth.register));
router.post("/auth/login", authLimiter, asyncHandler(auth.login));
router.post("/auth/refresh", authLimiter, asyncHandler(auth.refresh));
router.get("/auth/me", requireAuth, asyncHandler(auth.me));
router.post("/auth/logout", asyncHandler(auth.logout));

router.get("/templates", asyncHandler(tpl.listTemplates));
router.get("/templates/:id", asyncHandler(tpl.getTemplate));

router.use("/posters", requireAuth);
router.post(
  "/posters",
  generationLimiter,
  photoUpload,
  asyncHandler(poster.createPoster),
);
router.get("/posters/my", asyncHandler(poster.myPosters));
router.get("/posters/:id", asyncHandler(poster.getPoster));
router.post(
  "/posters/:id/regenerate",
  generationLimiter,
  asyncHandler(poster.regeneratePoster),
);
router.delete("/posters/:id", asyncHandler(poster.deletePoster));
