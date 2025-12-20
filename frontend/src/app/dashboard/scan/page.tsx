"use client";

import { apiClient } from "@/lib/api";
import { Camera, CheckCircle2, Loader2, Upload, X, Zap } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import Webcam from "react-webcam";
import { file } from "zod";

interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  severity: string;
}

export default function ScanPage() {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleUserMedia = () => {
    setCameraError(null);
    toast.success("Camera activated successfully!");
  };

  const handleUserMediaError = (error: any) => {
    console.error("Camera error:", error);
    setCameraError("Could not access camera. Please check permissions.");
    toast.error("Camera access denied. Please allow camera permissions.");
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
      setCapturing(false);
      toast.success("Image captured successfully!");
    } else {
      toast.error("Failed to capture image");
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setAnalyzing(true);
    try {
      // Convert base64 to blob
      const blob = await fetch(capturedImage).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const response = await apiClient.image.analyze(formData);
      setResult(response.data);
      toast.success("Image analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze image. Please try again.");
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
      toast.error("Image size should be less than 10MB");
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setCameraActive(false);
      toast.success("Image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
    setCameraActive(true);
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setCameraActive(false);
  };

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiClient.image.analyze(formData);
      setResult(response.data);
      toast.success("Image analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Medical Image Scanner
        </h1>
        <p className="text-gray-600 mb-8">
          Real camera access with AI-powered image analysis
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {!cameraActive && !capturedImage && (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose an option to get started
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <button
                  onClick={() => setCameraActive(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 justify-center"
                >
                  <Camera className="w-5 h-5" />
                  Use Camera
                </button>
                <label className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition cursor-pointer flex items-center gap-2 justify-center">
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
            </div>
          )}

          {cameraActive && (
            <div>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "user",
                }}
                className="w-full rounded-lg"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={capture}
                  disabled={capturing}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Capture Photo
                </button>
                <button
                  onClick={() => setCameraActive(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {capturedImage && !cameraActive && (
            <div>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze with AI"
                  )}
                </button>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setResult(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                >
                  Retake
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Results:
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Analysis:</span>
                  <p className="text-gray-700 mt-1">{result.analysis}</p>
                </div>
                {result.severity && (
                  <div>
                    <span className="font-medium">Severity:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-sm ${
                        result.severity === "high"
                          ? "bg-red-100 text-red-800"
                          : result.severity === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {result.severity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            ✅ Real Camera Features:
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Real webcam access using react-webcam</li>
            <li>✅ Live camera preview</li>
            <li>✅ Photo capture functionality</li>
            <li>✅ File upload support</li>
            <li>✅ Google Gemini Vision AI analysis</li>
            <li>✅ Medical image recognition</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
