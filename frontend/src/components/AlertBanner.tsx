"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function AlertBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if banner was previously closed
    const wasClosed = localStorage.getItem("alertBannerClosed");
    if (!wasClosed) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("alertBannerClosed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <span className="font-medium text-sm md:text-base">
            🎉 Welcome to MedicSense AI - Your 24/7 AI Healthcare Assistant | No
            sign-up required!
          </span>
        </div>
        <button
          onClick={handleClose}
          className="hover:bg-white/20 p-1 rounded transition flex-shrink-0"
          aria-label="Close banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
