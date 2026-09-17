import axios from "axios";
import type { CropScanResult, FarmerDashboardSummary, ScanSummary, ApiError } from "../types";
import { cropScanResultSchema } from "./validation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Accept": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const formattedError: ApiError = {
      error_code: error.response?.data?.error_code || "UNKNOWN_ERROR",
      message: error.response?.data?.message || error.message || "Network request failed",
    };
    return Promise.reject(formattedError);
  }
);

export const scanApi = {
  async submitScan(
    imageFile: File,
    location?: { latitude: number | null; longitude: number | null }
  ): Promise<CropScanResult> {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (location?.latitude !== undefined && location?.latitude !== null) {
      formData.append("latitude", location.latitude.toString());
    }
    if (location?.longitude !== undefined && location?.longitude !== null) {
      formData.append("longitude", location.longitude.toString());
    }

    const response = await apiClient.post("/api/v1/scans", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return cropScanResultSchema.parse(response.data);
  },

  async getScanById(scanId: string): Promise<CropScanResult> {
    const response = await apiClient.get(`/api/v1/scans/${scanId}`);
    return cropScanResultSchema.parse(response.data);
  },

  async getScanHistory(): Promise<ScanSummary[]> {
    const response = await apiClient.get("/api/v1/scans/history");
    return response.data;
  },

  async getDashboardSummary(): Promise<FarmerDashboardSummary> {
    const response = await apiClient.get("/api/v1/farmer/dashboard");
    return response.data;
  },
};
