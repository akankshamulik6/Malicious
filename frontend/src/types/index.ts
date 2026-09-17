// ==========================================
// CANONICAL TYPES (EXACT CONTRACT MATCHING MEMBER 1, 2 & 4)
// ==========================================

export type DiseaseStatus = "healthy" | "diseased" | "unknown";

export interface ExplainabilityResult {
  method: string;
  available: boolean;
  heatmap_url: string | null;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionResult {
  class_name: string;
  confidence: number; // Float range [0.0, 1.0]
  bounding_box: BoundingBox | null;
}

export interface PredictionResponse {
  scan_id: string;
  crop: string;
  disease: string;
  status: DiseaseStatus;
  confidence: number; // Float range [0.0, 1.0]
  model_name: string;
  model_version: string;
  processing_time_ms: number;
  explainability: ExplainabilityResult;
  detections: DetectionResult[];
}

export interface RegionalInsight {
  available: boolean;
  region: string | null;
  trend: string | null;
  source: string | null;
  observed_period: string | null;
}

export interface AgriculturalAdvisory {
  scan_id: string;
  crop: string;
  disease: string;
  status: DiseaseStatus;
  confidence: number;
  description: string | null;
  symptoms: string[];
  possible_causes: string[];
  severity: "low" | "moderate" | "high" | "unknown";
  management_practices: string[];
  preventive_measures: string[];
  regional_insight: RegionalInsight | null;
  advisory_status: "ready" | "requires_review" | "not_available";
}

// Aggregated Result from Member 4 Backend API
export interface CropScanResult {
  prediction: PredictionResponse;
  advisory: AgriculturalAdvisory | null;
}

export type ScanStatus =
  | "idle"
  | "image_selected"
  | "uploading"
  | "analyzing"
  | "success"
  | "error";

export interface LocationContext {
  country: string | null;
  state: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ScanSummary {
  scan_id: string;
  crop: string;
  disease: string;
  status: DiseaseStatus;
  confidence: number;
  created_at: string;
  image_url?: string;
}

export interface FarmerDashboardSummary {
  total_scans: number;
  healthy_scans: number;
  diseased_scans: number;
  recent_scans: ScanSummary[];
}

export interface ApiError {
  error_code: string;
  message: string;
}