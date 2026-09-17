import React, { useState } from "react";
import axios from "axios";
import { ScanResultPage } from "./pages/ScanResultPage";
import type { CropScanResult } from "./types";
import { Sparkles, Upload, Loader2, Scan } from "lucide-react";
import { AuthModal } from "./components/AuthModal";
import { getStoredToken } from "./services/api";
import type { User } from "./types/api";

const API_URL = "https://malicious-backend-azgv.onrender.com";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [result, setResult] = useState<CropScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Authentication
  const [showAuth, setShowAuth] = useState(!getStoredToken());
  const [user, setUser] = useState<User | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a crop image first.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setShowAuth(true);
      setError("Please login first to analyze a crop.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("image", selectedFile);

      // Location information
      formData.append("latitude", "18.6298");
      formData.append("longitude", "73.7997");
      formData.append("country", "India");
      formData.append("state", "Maharashtra");
      formData.append("district", "Pune");

      const response = await axios.post<CropScanResult>(
        `${API_URL}/api/v1/scans`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "REAL BACKEND RESPONSE:",
        response.data
      );

      setResult(response.data);
    } catch (err: any) {
      console.error("SCAN ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.detail ||
            `Backend error: ${err.response.status}`
        );
      } else {
        setError(
          "Could not connect to backend. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    setResult(null);
    setSelectedFile(null);
    setImageUrl("");
    setError("");
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuth(false);
    setError("");
  };

  // Show result page
  if (result) {
    return (
      <div className="min-h-screen bg-[#0F1715] text-white flex justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <ScanResultPage
            result={result}
            imageUrl={imageUrl}
            onNewScan={handleNewScan}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1715] text-white flex justify-center py-8 px-4">

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          if (getStoredToken()) {
            setShowAuth(false);
          }
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      <div className="w-full max-w-md bg-[#141E1B] rounded-3xl border border-[#23352E] shadow-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-6">

          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#22E570]" />

            <div>
              <h1 className="text-xl font-bold">
                GreenMind AI
              </h1>

              <p className="text-xs text-gray-400">
                Smart Crop Health Analysis
              </p>
            </div>
          </div>

          {/* Login button */}
          {!getStoredToken() && (
            <button
              onClick={() => setShowAuth(true)}
              className="px-3 py-2 bg-[#1B3B2B] text-[#22E570] border border-[#22E570]/30 rounded-xl text-xs font-bold hover:bg-[#22E570]/20 transition"
            >
              Login
            </button>
          )}

          {/* Logged-in indicator */}
          {getStoredToken() && (
            <div className="text-xs text-[#22E570] font-semibold">
              {user?.name ? `Hi, ${user.name}` : "Logged in"}
            </div>
          )}

        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed border-[#22E570]/40 rounded-2xl p-5 text-center">

          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Selected crop"
              className="w-full h-64 object-cover rounded-xl mb-4"
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">

              <Upload className="w-10 h-10 mb-3 text-[#22E570]" />

              <p className="text-sm font-semibold">
                Upload a crop leaf image
              </p>

              <p className="text-xs mt-1">
                JPG, JPEG or PNG
              </p>

            </div>
          )}

          <label className="inline-block cursor-pointer">

            <div className="px-5 py-2.5 bg-[#1B3B2B] text-[#22E570] border border-[#22E570]/30 rounded-xl text-sm font-bold hover:bg-[#22E570]/20 transition">

              {selectedFile
                ? "Change Image"
                : "Choose Image"}

            </div>

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />

          </label>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs">
            {error}
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className="w-full mt-5 py-3.5 bg-[#22E570] text-black font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition flex items-center justify-center gap-2"
        >

          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Analyzing...
            </>
          ) : (
            <>
              <Scan className="w-5 h-5" />
              Analyze Crop
            </>
          )}

        </button>

      </div>
    </div>
  );
}