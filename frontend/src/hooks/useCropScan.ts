import { useState, useCallback } from "react";
import type { CropScanResult, ScanStatus, ApiError } from "../types";
import { scanApi } from "../api/scanApi";

export function useCropScan() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CropScanResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const selectImage = useCallback((file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError({
        error_code: "INVALID_FILE_TYPE",
        message: "Please select a valid JPG, PNG, or WEBP leaf image.",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError({
        error_code: "FILE_TOO_LARGE",
        message: "Image size exceeds 10MB limit.",
      });
      return;
    }

    setError(null);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanStatus("image_selected");
  }, []);

  const analyzeCrop = useCallback(
    async (location?: { latitude: number | null; longitude: number | null }) => {
      if (!selectedImage) return;

      setScanStatus("uploading");
      setError(null);

      try {
        setScanStatus("analyzing");
        const result = await scanApi.submitScan(selectedImage, location);
        setScanResult(result);
        setScanStatus("success");
      } catch (err: any) {
        setScanStatus("error");
        setError(err as ApiError);
      }
    },
    [selectedImage]
  );

  const resetScan = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScanStatus("idle");
    setSelectedImage(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError(null);
  }, [previewUrl]);

  return {
    scanStatus,
    selectedImage,
    previewUrl,
    scanResult,
    error,
    selectImage,
    analyzeCrop,
    resetScan,
  };
}
