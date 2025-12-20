"use client";

import {
  Activity,
  ArrowRight,
  Brain,
  Calendar,
  Camera,
  CheckCircle,
  FileText,
  Heart,
  MessageSquare,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Add scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in-section").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Diagnosis",
      description:
        "Advanced symptom analysis using Google Gemini AI with 95% accuracy",
      color: "from-blue-500 to-cyan-500",
      link: "/dashboard/chat",
    },
    {
      icon: Calendar,
      title: "Smart Appointments",
      description: "Automated scheduling with real-time doctor availability",
      color: "from-green-500 to-emerald-500",
      link: "/dashboard/appointments",
    },
    {
      icon: MessageSquare,
      title: "24/7 AI Assistant",
      description: "Instant medical guidance powered by NLP technology",
      color: "from-purple-500 to-pink-500",
      link: "/dashboard/chat",
    },
    {
      icon: Camera,
      title: "Image Analysis",
      description: "AI-powered medical image recognition and analysis",
      color: "from-orange-500 to-red-500",
      link: "/dashboard/scan",
    },
    {
      icon: Activity,
      title: "Health Monitoring",
      description: "Track vitals and health metrics with real-time insights",
      color: "from-teal-500 to-blue-500",
      link: "/dashboard/vitals",
    },
    {
      icon: FileText,
      title: "Digital Reports",
      description: "Secure storage and instant access to medical records",
      color: "from-indigo-500 to-purple-500",
      link: "/dashboard/reports",
    },
  ];

  const solutions = [
    {
      problem: "Long Wait Times",
      solution: "Instant AI-powered preliminary diagnosis",
      icon: Zap,
      link: "/dashboard/chat",
    },
    {
      problem: "Manual Scheduling",
      solution: "Automated appointment booking system",
      icon: Calendar,
      link: "/dashboard/appointments",
    },
    {
      problem: "Limited Access",
      solution: "24/7 AI healthcare assistant",
      icon: Heart,
      link: "/dashboard/chat",
    },
    {
      problem: "Data Management",
      solution: "Cloud-based secure health records",
      icon: Shield,
      link: "/dashboard/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  MedicSense AI
                </h1>
                <p className="text-xs text-gray-600">Healthcare Reimagined</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Features
              </a>
              <a
                href="#solutions"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Solutions
              </a>
              <Link
                href="/dashboard/chat"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                AI Chat
              </Link>
              <Link
                href="/dashboard/appointments"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Appointments
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                AI-Powered Healthcare Solution
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Healthcare Delays
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Solved by AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of healthcare with AI-powered diagnosis,
              automated appointments, and 24/7 intelligent patient engagement
              using advanced NLP technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard/chat"
                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Try AI Chat
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 fade-in-section">
            {[
              { value: "95%", label: "AI Accuracy" },
              { value: "24/7", label: "Availability" },
              { value: "<2min", label: "Response Time" },
              { value: "100%", label: "Data Security" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Solutions Section */}
      <section id="solutions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Solving Healthcare Challenges
            </h2>
            <p className="text-xl text-gray-600">
              Our AI-powered solutions address critical healthcare problems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="fade-in-section bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer group"
              >
                <item.icon className="w-12 h-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Problem: {item.problem}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      → Solution: {item.solution}
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Try Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for comprehensive healthcare management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.link}
                className="fade-in-section bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-300 cursor-pointer group"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore Feature
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center fade-in-section">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of users experiencing the future of healthcare today
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-indigo-400" />
                <span className="text-xl font-bold">MedicSense AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-Powered Healthcare Solution | 100% Secure & Private
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/chat"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  AI Chat
                </Link>
                <Link
                  href="/dashboard/appointments"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Appointments
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard/scan"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Image Analysis
                </Link>
                <Link
                  href="/dashboard/vitals"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Health Monitoring
                </Link>
                <Link
                  href="/dashboard/reports"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Medical Reports
                </Link>
                <Link
                  href="/dashboard/search"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Search
                </Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="flex flex-col gap-2">
                <a
                  href="#features"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  About
                </a>
                <a
                  href="#solutions"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Solutions
                </a>
                <Link
                  href="/dashboard/notifications"
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Notifications
                </Link>
                <span className="text-gray-400 text-sm">24/7 Help</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-400">
              <span>© 2025 MedicSense AI</span>
              <span className="hidden md:block">•</span>
              <span>HIPAA Compliant</span>
              <span className="hidden md:block">•</span>
              <span>ISO 27001 Certified</span>
              <span className="hidden md:block">•</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
