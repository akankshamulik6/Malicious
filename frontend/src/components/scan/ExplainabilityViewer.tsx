import React, { useRef, useState, useEffect } from "react";
import type { PredictionResponse } from "../../types";

interface Props {
  prediction: PredictionResponse;
  imageUrl: string;
}

export const ExplainabilityViewer: React.FC<Props> = ({
  prediction,
  imageUrl,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ scaleX: 1, scaleY: 1 });
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const {
        naturalWidth,
        naturalHeight,
        clientWidth,
        clientHeight,
      } = imgRef.current;

      setScale({
        scaleX: clientWidth / (naturalWidth || 1),
        scaleY: clientHeight / (naturalHeight || 1),
      });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleImageLoad);

    return () => {
      window.removeEventListener("resize", handleImageLoad);
    };
  }, []);

  const activeImage =
    showHeatmap && prediction.explainability.heatmap_url
      ? prediction.explainability.heatmap_url
      : imageUrl;

  return (
    <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-800">
          Visual Diagnostics
        </h3>

        {prediction.explainability.available &&
          prediction.explainability.heatmap_url && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200"
            >
              {showHeatmap ? "View Image" : "View AI Heatmap"}
            </button>
          )}
      </div>

      <div className="relative inline-block w-full overflow-hidden rounded-xl bg-gray-900">
        <img
          ref={imgRef}
          src={activeImage}
          alt="Crop leaf scan"
          onLoad={handleImageLoad}
          className="w-full h-auto object-contain max-h-[350px] mx-auto"
        />

        {!showHeatmap &&
          prediction.detections.map((det, index) => {
            if (!det.bounding_box) return null;

            const { x1, y1, x2, y2 } = det.bounding_box;

            const scaledX = x1 * scale.scaleX;
            const scaledY = y1 * scale.scaleY;
            const scaledWidth = (x2 - x1) * scale.scaleX;
            const scaledHeight = (y2 - y1) * scale.scaleY;

            return (
              <div
                key={index}
                style={{
                  left: `${scaledX}px`,
                  top: `${scaledY}px`,
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                }}
                className="absolute border-2 border-amber-400 bg-amber-400/20 rounded pointer-events-none"
              >
                <span className="absolute -top-6 left-0 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  {det.class_name} ({Math.round(det.confidence * 100)}%)
                </span>
              </div>
            );
          })}
      </div>

      {!prediction.explainability.available && (
        <p className="text-xs text-gray-500 mt-2 italic text-center">
          Visual explainability heatmap is currently unavailable for this
          prediction model.
        </p>
      )}
    </div>
  );
};