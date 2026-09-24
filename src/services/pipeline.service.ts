import { Poster } from "../models/Poster";
import { Template } from "../models/Template";
import { generateLayout } from "./gemini.service";
import { renderPoster } from "./poster.service";
import { uploadBuffer } from "./cloudinary.service";
import { aiLayoutSchema } from "../validators/aiLayout.validator";

/** Runs Gemini -> renderer -> upload for one attempt. Never throws; failures are recorded on the poster. */
export async function runGeneration(posterId: string): Promise<void> {
  const poster = await Poster.findById(posterId);
  if (!poster) return;
  try {
    const template = await Template.findById(poster.templateId).lean();
    if (!template) throw new Error("Template no longer exists");

    const attempt = poster.generationAttempts + 1;
    const { layout, usedFallback } = await generateLayout({
      templateTitle: template.title,
      occasionType: template.occasionType,
      photoCount: poster.uploadedPhotoUrls.length,
      headline: poster.formData?.headline ?? "",
      fallback: aiLayoutSchema.parse(
        JSON.parse(JSON.stringify(template.layoutConfig)),
      ),
      attempt,
    });

    const png = await renderPoster({
      template,
      photos: poster.uploadedPhotoUrls,
      aiLayout: layout,
      formData: JSON.parse(JSON.stringify(poster.formData)),
    });
    const url = await uploadBuffer(png, "generated");

    poster.set({
      generatedImageUrl: url,
      aiLayout: layout,
      aiUsedFallback: usedFallback,
      status: "completed",
      generationAttempts: attempt,
      errorMessage: undefined,
    });
  } catch (e) {
    console.error("Generation failed", e);
    poster.set({
      status: "failed",
      errorMessage: "Poster generation failed. Please try again.",
    });
  }
  await poster.save();
}
