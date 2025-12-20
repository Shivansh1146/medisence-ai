"use client";

import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { ArrowLeft, CheckCircle2, Loader2, Phone, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function OTPLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOTP, setDemoOTP] = useState("");

  // Timer for resend OTP
  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.length < 13) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      // Send OTP via backend
      const response = await axios.post(
        "http://localhost:5000/api/auth/otp/send",
        {
          phone: phone,
        }
      );

      if (response.data.success) {
        toast.success("OTP sent successfully!");
        setDemoOTP(response.data.otp); // For demo - remove in production
        setStep("otp");
        startTimer();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: unknown) {
      console.error("Send OTP error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP via backend
      const response = await axios.post(
        "http://localhost:5000/api/auth/otp/verify",
        {
          phone: phone,
          otp: otp,
        }
      );

      if (response.data.success) {
        toast.success("OTP verified successfully!");

        // Login user
        const user = {
          id: phone.replace("+", ""),
          email: `${phone.replace("+", "")}@medisense.ai`,
          name: `User ${phone.slice(-4)}`,
          phone: phone,
        };

        login(user, "phone");
        router.push("/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error: unknown) {
      console.error("Verify OTP error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/otp/resend",
        {
          phone: phone,
        }
      );

      if (response.data.success) {
        toast.success("OTP resent successfully!");
        setDemoOTP(response.data.otp); // For demo
        setOtp("");
        startTimer();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Phone Verification
          </h1>
          <p className="text-gray-600">Secure login with OTP verification</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {step === "phone" ? (
            // Phone Number Step
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (!value.startsWith("+91")) {
                        value = "+91" + value.replace(/\D/g, "");
                      }
                      setPhone(value.slice(0, 13));
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We'll send you a 6-digit OTP for verification
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 13}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <Shield className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            // OTP Verification Step
            <div className="space-y-6">
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setDemoOTP("");
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change phone number
              </button>

              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit OTP sent to
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  {phone}
                </p>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setOtp(value.slice(0, 6));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                      placeholder="● ● ● ● ● ●"
                      maxLength={6}
                      required
                    />
                  </div>

                  {/* Demo OTP Display - Remove in production */}
                  {demoOTP && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Demo Mode:</strong> Your OTP is{" "}
                        <span className="font-mono font-bold text-lg">
                          {demoOTP}
                        </span>
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend OTP */}
                <div className="mt-4 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend OTP in{" "}
                      <span className="font-semibold text-blue-600">
                        {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Secure & Private
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Your phone number is encrypted and never shared with third
                  parties
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to other login options
          </button>
        </div>
      </div>
    </div>
  );
}
