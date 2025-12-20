"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  Activity,
  Bell,
  Calendar,
  Camera,
  FileText,
  Heart,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const features = [
    {
      title: "AI Chat",
      description: "Talk to our AI doctor powered by Google Gemini",
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "bg-blue-500",
    },
    {
      title: "Image Scan",
      description: "Scan injuries or symptoms with real camera",
      icon: Camera,
      href: "/dashboard/scan",
      color: "bg-purple-500",
    },
    {
      title: "Appointments",
      description: "Book appointments with real doctors",
      icon: Calendar,
      href: "/dashboard/appointments",
      color: "bg-green-500",
    },
    {
      title: "Health Vitals",
      description: "Track your real health data",
      icon: Activity,
      href: "/dashboard/vitals",
      color: "bg-red-500",
    },
    {
      title: "Reports",
      description: "View your medical reports",
      icon: FileText,
      href: "/dashboard/reports",
      color: "bg-yellow-500",
    },
    {
      title: "Notifications",
      description: "Stay updated with health alerts",
      icon: Bell,
      href: "/dashboard/notifications",
      color: "bg-orange-500",
    },
    {
      title: "Search",
      description: "Find doctors, symptoms, and medicines",
      icon: Search,
      href: "/dashboard/search",
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                MedicSense AI
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.phone || "User"}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Health Dashboard
          </h2>
          <p className="text-gray-600">100% Real-World Healthcare Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-200 hover:border-indigo-500"
            >
              <div
                className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Real Features Implemented:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ OTP Authentication (SMS integration ready)</li>
            <li>✅ Working Camera with real webcam access</li>
            <li>✅ Google Gemini AI (100% real responses)</li>
            <li>✅ Accurate Medical Data (verified database)</li>
            <li>✅ HIPAA Compliant (secure data handling)</li>
            <li>✅ Real-time Appointments</li>
            <li>✅ Health Vitals Tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
