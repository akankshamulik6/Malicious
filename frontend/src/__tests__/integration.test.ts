import { describe, it, expect } from "vitest";
import { predictionResponseSchema, advisorySchema } from "../api/validation";

describe("Cross-Member API Contract Validation", () => {
  it("strictly matches Member 1 PredictionResponse contract without payload transformation", () => {
    const validMember1Payload = {
      scan_id: "scan_882910",
      crop: "Tomato",
      disease: "Tomato Early Blight",
      status: "diseased",
      confidence: 0.94,
      model_name: "crop_disease_classifier",
      model_version: "1.0.0",
      processing_time_ms: 750,
      explainability: {
        method: "grad_cam",
        available: true,
        heatmap_url: null,
      },
      detections: [
        {
          class_name: "early_blight_lesion",
          confidence: 0.91,
          bounding_box: { x1: 10, y1: 20, x2: 100, y2: 120 },
        },
      ],
    };

    const parsed = predictionResponseSchema.parse(validMember1Payload);
    expect(parsed.confidence).toBe(0.94);
    expect(parsed.status).toBe("diseased");
    expect(parsed.detections[0].bounding_box?.x2).toBe(100);
  });

  it("strictly enforces Member 1 DiseaseStatus lowercase enum values", () => {
    const invalidMember1Payload = {
      scan_id: "scan_882911",
      crop: "Tomato",
      disease: "Tomato Early Blight",
      status: "DISEASED", // Uppercase value invalid
      confidence: 0.94,
      model_name: "crop_disease_classifier",
      model_version: "1.0.0",
      processing_time_ms: 750,
      explainability: { method: "grad_cam", available: true, heatmap_url: null },
      detections: [],
    };

    expect(() => predictionResponseSchema.parse(invalidMember1Payload)).toThrow();
  });

  it("strictly matches Member 2 AgriculturalAdvisory contract", () => {
    const validMember2Payload = {
      scan_id: "scan_882910",
      crop: "Tomato",
      disease: "Tomato Early Blight",
      status: "diseased",
      confidence: 0.94,
      description: "Fungal infection causing dark concentric ring spots.",
      symptoms: ["Dark concentric spots on leaves"],
      possible_causes: ["Alternaria solani fungal pathogen"],
      severity: "moderate",
      management_practices: ["Apply copper-based fungicide"],
      preventive_measures: ["Practice 3-year crop rotation"],
      regional_insight: {
        available: true,
        region: "Maharashtra",
        trend: "Rising humidity increasing spore spread",
        source: "Agricultural Department",
        observed_period: "Monsoon 2026",
      },
      advisory_status: "ready",
    };

    const parsed = advisorySchema.parse(validMember2Payload);
    expect(parsed.severity).toBe("moderate");
    expect(parsed.regional_insight?.available).toBe(true);
    expect(parsed.advisory_status).toBe("ready");
  });
});