import React from "react";
import { useTranslation } from "react-i18next";
import type { CropScanResult } from "../types";
import { ExplainabilityViewer } from "../components/scan/ExplainabilityViewer";
import { AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, Info } from "lucide-react";

interface Props {
  result: CropScanResult;
  imageUrl: string;
  onNewScan: () => void;
}

export const ScanResultPage: React.FC<Props> = ({ result, imageUrl, onNewScan }) => {
  const { t } = useTranslation();
  const { prediction, advisory } = result;

  const confidencePercent = Math.round(prediction.confidence * 100);

  const renderStatusBadge = () => {
    switch (prediction.status) {
      case "healthy":
        return (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold text-xs border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>{t("statusHealthy")}</span>
          </div>
        );
      case "diseased":
        return (
          <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-full font-bold text-xs border border-rose-200">
            <AlertTriangle className="w-4 h-4" />
            <span>{t("statusDiseased")}</span>
          </div>
        );
      case "unknown":
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-bold text-xs border border-amber-200">
            <HelpCircle className="w-4 h-4" />
            <span>{t("statusUnknown")}</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* 1. PREDICTION CARD (MEMBER 1 DATA) */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Crop</span>
            <h1 className="text-2xl font-bold text-gray-900">{prediction.crop}</h1>
          </div>
          {renderStatusBadge()}
        </div>

        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Condition</span>
          <h2 className="text-lg font-bold text-emerald-950">
            {prediction.status === "unknown" ? "Unknown Condition" : prediction.disease}
          </h2>
        </div>

        {/* Confidence Meter */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-600">{t("confidence")}</span>
            <span className="text-emerald-800">{confidencePercent}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${prediction.confidence > 0.7 ? "bg-emerald-600" : "bg-amber-500"
                }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. EXPLAINABILITY VIEWER */}
      <ExplainabilityViewer prediction={prediction} imageUrl={imageUrl} />

      {/* 3. UNKNOWN PREDICTION FALLBACK STATE */}
      {prediction.status === "unknown" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>{t("unknownMsg")}</span>
          </div>
          <p className="text-xs font-semibold text-amber-800">{t("unknownStepsTitle")}</p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
            <li>{t("unknownStep1")}</li>
            <li>{t("unknownStep2")}</li>
            <li>{t("unknownStep3")}</li>
          </ul>
        </div>
      )}

      {/* 4. HEALTHY STATE */}
      {prediction.status === "healthy" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 space-y-1.5">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Crop Appears Healthy
          </h3>
          <p className="text-xs text-emerald-800 leading-relaxed">
            No fungal or bacterial disease lesions were detected. Maintain normal watering schedules, balanced fertilizer application, and periodic field inspections.
          </p>
        </div>
      )}

      {/* 5. DISEASED STATE & MEMBER 2 ADVISORY DETAILS */}
      {prediction.status === "diseased" && advisory && (
        <div className="space-y-3">
          {advisory.advisory_status === "requires_review" && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t("requiresReview")}</span>
            </div>
          )}

          {advisory.advisory_status === "not_available" ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-600 p-4 rounded-xl text-xs text-center">
              {t("advisoryUnavailable")}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm space-y-4">
              {/* Severity */}
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <span className="text-xs font-bold text-gray-500">Severity Level</span>
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${advisory.severity === "high" ? "bg-rose-100 text-rose-700" :
                    advisory.severity === "moderate" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                  {advisory.severity}
                </span>
              </div>

              {/* Symptoms */}
              {advisory.symptoms.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1">{t("symptoms")}</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    {advisory.symptoms.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}

              {/* Causes */}
              {advisory.possible_causes.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1">{t("causes")}</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    {advisory.possible_causes.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}

              {/* Management */}
              {advisory.management_practices.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1">{t("management")}</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    {advisory.management_practices.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}

              {/* Prevention */}
              {advisory.preventive_measures.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1">{t("prevention")}</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    {advisory.preventive_measures.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}

              {/* Regional Intelligence */}
              {advisory.regional_insight?.available && (
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold">{t("regionalTrend")} ({advisory.regional_insight.region})</span>
                  <p className="text-[11px] text-emerald-800">{advisory.regional_insight.trend}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. DISCLAIMER */}
      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        {t("disclaimer")}
      </p>

      {/* Action Button */}
      <button
        onClick={onNewScan}
        className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md text-sm active:scale-95 transition-transform"
      >
        Scan Another Leaf
      </button>
    </div>
  );
};