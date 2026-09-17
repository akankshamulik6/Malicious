import { z } from "zod";

export const diseaseStatusSchema = z.enum(["healthy", "diseased", "unknown"]);

export const predictionResponseSchema = z.object({
  scan_id: z.string(),
  crop: z.string(),
  disease: z.string(),
  status: diseaseStatusSchema,
  confidence: z.number().min(0).max(1),
  model_name: z.string(),
  model_version: z.string(),
  processing_time_ms: z.number().int().nonnegative(),
  explainability: z.object({
    method: z.string(),
    available: z.boolean(),
    heatmap_url: z.string().nullable(),
  }),
  detections: z.array(
    z.object({
      class_name: z.string(),
      confidence: z.number().min(0).max(1),
      bounding_box: z
        .object({
          x1: z.number().nonnegative(),
          y1: z.number().nonnegative(),
          x2: z.number().nonnegative(),
          y2: z.number().nonnegative(),
        })
        .nullable(),
    })
  ),
});

export const advisorySchema = z.object({
  scan_id: z.string(),
  crop: z.string(),
  disease: z.string(),
  status: diseaseStatusSchema,
  confidence: z.number().min(0).max(1),
  description: z.string().nullable(),
  symptoms: z.array(z.string()),
  possible_causes: z.array(z.string()),
  severity: z.enum(["low", "moderate", "high", "unknown"]),
  management_practices: z.array(z.string()),
  preventive_measures: z.array(z.string()),
  regional_insight: z
    .object({
      available: z.boolean(),
      region: z.string().nullable(),
      trend: z.string().nullable(),
      source: z.string().nullable(),
      observed_period: z.string().nullable(),
    })
    .nullable(),
  advisory_status: z.enum(["ready", "requires_review", "not_available"]),
});

export const cropScanResultSchema = z.object({
  prediction: predictionResponseSchema,
  advisory: advisorySchema.nullable(),
});