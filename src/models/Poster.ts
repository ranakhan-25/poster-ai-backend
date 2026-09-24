import { Schema, model, Document, Types } from "mongoose";

export const POSTER_STATUS = [
  "draft",
  "generating",
  "completed",
  "failed",
] as const;

export interface IPoster extends Document {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  formData: {
    headline: string;
    name: string;
    designation?: string;
    party?: string;
    organization?: string;
    district?: string;
    upazila?: string;
    footerCredit?: string;
  };
  uploadedPhotoUrls: string[];
  generatedImageUrl?: string;
  status: (typeof POSTER_STATUS)[number];
  errorMessage?: string;
  generationAttempts: number;
  aiLayout?: unknown;
  aiUsedFallback: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const posterSchema = new Schema<IPoster>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    formData: {
      headline: { type: String, required: true },
      name: { type: String, required: true },
      designation: String,
      party: String,
      organization: String,
      district: String,
      upazila: String,
      footerCredit: String,
    },
    uploadedPhotoUrls: [String],
    generatedImageUrl: String,
    status: { type: String, enum: POSTER_STATUS, default: "draft" },
    errorMessage: String,
    generationAttempts: { type: Number, default: 0 },
    aiLayout: Schema.Types.Mixed,
    aiUsedFallback: { type: Boolean, default: false },
  },
  { timestamps: true },
);
posterSchema.index({ userId: 1, createdAt: -1 });
export const Poster = model<IPoster>("Poster", posterSchema);
