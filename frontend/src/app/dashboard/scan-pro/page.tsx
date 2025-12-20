"use client";

import { apiClient } from "@/lib/api";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import Webcam from "react-webcam";

interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  severity: string;
}

export default function ProfessionalScanPage() {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleUserMedia = () => {
    setCameraError(null);
    toast.success("Camera activated!");
  };

  const handleUserMediaError = (error: any) => {
    console.error("Camera error:", error);
    setCameraError("Camera access denied. Please allow permissions.");
    toast.error("Could not access camera");
  };

  const startCamera = () => {
    setCameraActive(true);
    setResult(null);
    setCapturedImage(null);
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setCameraActive(false);
      toast.success("Image captured!");
    } else {
      toast.error("Failed to capture image");
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setAnalyzing(true);
    try {
      const blob = await fetch(capturedImage).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "scan.jpg");

      const response = await apiClient.image.analyze(formData);
      setResult(response.data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setCameraActive(false);
      toast.success("Image uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setCameraActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Medical Image Scanner
            </h1>
          </div>
          <p className="text-gray-600">
            Advanced AI-powered medical image analysis powered by Google Gemini
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Camera/Image */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {!cameraActive && !capturedImage && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Get Started
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose how you want to scan
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={startCamera}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Use Camera
                  </button>

                  <label className="w-full px-6 py-4 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition cursor-pointer font-medium flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Info Cards */}
                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3 text-left p-3 bg-blue-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        AI-Powered Analysis
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Google Gemini Vision for accurate diagnosis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left p-3 bg-purple-50 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Instant Results
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Get diagnosis in seconds
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cameraActive && (
              <div>
                <div className="relative rounded-xl overflow-hidden bg-black">
                  {cameraError ? (
                    <div className="aspect-video flex items-center justify-center bg-gray-900 text-white p-6 text-center">
                      <div>
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                        <p className="text-sm">{cameraError}</p>
                        <button
                          onClick={() => {
                            setCameraError(null);
                            setCameraActive(false);
                          }}
                          className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: "user",
                      }}
                      onUserMedia={handleUserMedia}
                      onUserMediaError={handleUserMediaError}
                      className="w-full"
                    />
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={capture}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={() => setCameraActive(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {capturedImage && !cameraActive && (
              <div>
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full rounded-xl"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!result && (
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze with AI
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {!result ? (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div>
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Waiting for Analysis
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Capture or upload an image to get AI-powered medical
                    analysis
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Analysis Complete
                    </h3>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {result.confidence}%
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Diagnosis
                  </h4>
                  <p className="text-gray-700">{result.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    result.severity === "High"
                      ? "bg-red-50 border border-red-200"
                      : result.severity === "Medium"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    Severity: {result.severity}
                  </p>
                </div>

                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Scan Another Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>Medical Disclaimer:</strong> This AI analysis is for
            informational purposes only and should not replace professional
            medical advice. Please consult a qualified healthcare provider for
            proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
