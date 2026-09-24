import { Request, Response } from "express";
import { z } from "zod";
import { Poster, IPoster } from "../models/Poster";
import { OCCASIONS, Template } from "../models/Template";
import { AppError } from "../utils/errors";
import { hasImageSignature } from "../middleware/upload";
import { uploadBuffer } from "../services/cloudinary.service";
import { runGeneration } from "../services/pipeline.service";
import { assertCanRegenerate, assertOwner } from "../services/ownership";
import {
  objectIdSchema,
  posterFormSchema,
} from "../validators/poster.validator";
import type { HydratedDocument } from "mongoose";

const userId = (req: Request) => req.user!.id;

async function findOwned(req: Request): Promise<HydratedDocument<IPoster>> {
  const id = objectIdSchema.parse(req.params.id);

  const poster = await Poster.findById(id);

  return assertOwner(poster, userId(req));
}

export async function createPoster(req: Request, res: Response) {
  const form = posterFormSchema.parse(req.body);

  const template = await Template.findOne({
    _id: form.templateId,
    isActive: true,
  });

  if (!template) {
    throw new AppError(404, "Template not found");
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const min = template.photoSlots?.min ?? 0;
  const max = Math.min(template.photoSlots?.max ?? 3, 3);

  if (files.length < min) {
    throw new AppError(400, `This template needs at least ${min} photo(s)`);
  }

  if (files.length > max) {
    throw new AppError(400, `This template allows at most ${max} photo(s)`);
  }

  if (files.some((file) => !hasImageSignature(file.buffer))) {
    throw new AppError(400, "One of the files is not a valid image");
  }

  const urls = await Promise.all(
    files.map((file) => uploadBuffer(file.buffer, "uploads", file.mimetype)),
  );

  const { templateId, ...formData } = form;

  const poster = await Poster.create({
    userId: userId(req),
    templateId,
    formData,
    uploadedPhotoUrls: urls,
    status: "generating",
  });

  // Generation runs in the background.
  // Client can poll GET /api/posters/:id
  void runGeneration(String(poster._id));

  return res.status(202).json({
    success: true,
    data: {
      id: String(poster._id),
      status: poster.status,
    },
  });
}

export async function getPoster(req: Request, res: Response) {
  const poster = await findOwned(req);

  return res.json({
    success: true,
    data: {
      poster,
    },
  });
}

export async function myPosters(req: Request, res: Response) {
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(6),
    search: z.string().trim().optional(),
    occasionType: z.enum(OCCASIONS).optional(),
  });

  const query = querySchema.parse(req.query);

  const filter: Record<string, unknown> = {
    userId: userId(req),
  };

  // Filter by occasion type through Template
  if (query.occasionType) {
    const templateIds = await Template.find({
      occasionType: query.occasionType,
      isActive: true,
    }).distinct("_id");

    filter.templateId = {
      $in: templateIds,
    };
  }

  // Search poster headline/name/organization/etc.
  if (query.search) {
    const searchRegex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    filter.$or = [
      { "formData.headline": searchRegex },
      { "formData.name": searchRegex },
      { "formData.designation": searchRegex },
      { "formData.party": searchRegex },
      { "formData.organization": searchRegex },
      { "formData.district": searchRegex },
      { "formData.upazila": searchRegex },
      { status: searchRegex },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [posters, total] = await Promise.all([
    Poster.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate("templateId", "title titleBn occasionType"),

    Poster.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / query.limit);

  return res.json({
    success: true,
    data: {
      posters,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    },
  });
}

export async function regeneratePoster(req: Request, res: Response) {
  const poster = await findOwned(req);

  assertCanRegenerate(poster);

  poster.status = "generating";

  await poster.save();

  void runGeneration(String(poster._id));

  return res.status(202).json({
    success: true,
    data: {
      id: String(poster._id),
      status: "generating",
    },
  });
}

export async function deletePoster(req: Request, res: Response) {
  const poster = await findOwned(req);

  await poster.deleteOne();

  return res.json({
    success: true,
    data: {},
  });
}
