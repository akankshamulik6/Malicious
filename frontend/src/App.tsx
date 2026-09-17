import React, { useState } from "react";
import { ScanResultPage } from "./pages/ScanResultPage";
import { CropScanResult } from "./types";
import { Scan, Sparkles, RefreshCw } from "lucide-react";

const mockResult: CropScanResult = {
  prediction: {
    scan_id: "scan_12345",
    crop: "Tomato Plant",
    disease: "Early Blight Infection",
    status: "diseased",
    confidence: 0.94,
    model_name: "crop_disease_classifier",
    model_version: "1.0.0",
    processing_time_ms: 320,
    explainability: { method: "grad_cam", available: true, heatmap_url: null },
    detections: [{ class_name: "early_blight_lesion", confidence: 0.92, bounding_box: { x1: 50, y1: 50, x2: 200, y2: 200 } }],
  },
  advisory: {
    scan_id: "scan_12345",
    crop: "Tomato Plant",
    disease: "Early Blight Infection",
    status: "diseased",
    confidence: 0.94,
    description: "Fungal infection causing severe leaf spot lesions.",
    symptoms: ["Dark concentric rings on lower leaves", "Yellow halo around foliage spots"],
    possible_causes: ["High ambient humidity (>80%)", "Alternaria solani fungal spores"],
    severity: "moderate",
    management_practices: ["Prune and dispose infected leaves", "Apply organic copper-based fungicide"],
    preventive_measures: ["Avoid overhead drip irrigation", "Maintain 2-foot plant spacing"],
    regional_insight: { available: true, region: "Maharashtra", trend: "High blight activity reported nearby", source: "Agri Dept", observed_period: "Current Season" },
    advisory_status: "ready",
  },
};

export default function App() {
  const [isScanning, setIsScanning] = useState(true);

  return (
    <div className="min-h-screen bg-[#0F1715] text-white flex justify-center py-8 px-4">
      <div className="w-full max-w-md bg-[#141E1B] rounded-3xl border border-[#23352E] shadow-2xl overflow-hidden p-6 flex flex-col gap-5">
        
        {/* App Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#22E570]" /> GreenMind AI
            </h1>
            <p className="text-xs text-gray-400">Smart Crop Health Analysis</p>
          </div>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#1B3B2B] text-[#22E570] border border-[#22E570]/30 rounded-full hover:bg-[#22E570]/20 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {isScanning ? "View Result" : "Rescan"}
          </button>
        </div>

        {/* Scanning View / Overlay */}
        {isScanning ? (
          <div className="relative w-full h-80 rounded-2xl overflow-hidden border-2 border-[#22E570]/40 shadow-inner group">
            <img
              src="https://images.unsplash.com/photo-1592417817098-8f3d6eb13655?w=600"
              alt="Leaf Preview"
              className="w-full h-full object-cover brightness-90"
            />
            
            {/* Animated Laser Scan Line */}
            <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22E570] to-transparent shadow-[0_0_15px_#22E570] animate-scan" />

            {/* Bounding Box Overlay */}
            <div className="absolute top-16 left-20 w-36 h-36 border-2 border-dashed border-[#22E570] bg-[#22E570]/10 rounded-lg flex items-start justify-end p-1">
              <span className="text-[10px] font-bold bg-[#22E570] text-black px-1.5 py-0.5 rounded shadow">
                Early Blight 92%
              </span>
            </div>

            {/* Corner Bracket Graphics */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#22E570]" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#22E570]" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#22E570]" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#22E570]" />

            {/* Status Footer Overlay */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0F1715] to-transparent p-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#22E570] flex items-center gap-1.5">
                <Scan className="w-4 h-4 animate-pulse" /> AI Diagnosing...
              </span>
              <button
                onClick={() => setIsScanning(false)}
                className="px-4 py-1.5 bg-[#22E570] text-black text-xs font-bold rounded-xl shadow-lg hover:bg-emerald-400 transition"
              >
                Show Advisory
              </button>
            </div>
          </div>
        ) : (
          /* Advisory Result Component */
          <ScanResultPage
            result={mockResult}
            imageUrl="https://images.unsplash.com/photo-1592417817098-8f3d6eb13655?w=600"
            onNewScan={() => setIsScanning(true)}
          />
        )}
      </div>
    </div>
  );
}