"use client";

import { Phone, X } from "lucide-react";
import { useState } from "react";

export default function EmergencyButton() {
  const [showModal, setShowModal] = useState(false);

  const emergencyNumbers = [
    {
      name: "Emergency Services",
      number: "911",
      description: "Police, Fire, Ambulance",
    },
    {
      name: "Hospital Emergency",
      number: "1-800-HOSPITAL",
      description: "Direct hospital line",
    },
    {
      name: "Poison Control",
      number: "1-800-222-1222",
      description: "24/7 poison help",
    },
    {
      name: "Mental Health Crisis",
      number: "988",
      description: "Suicide & Crisis Lifeline",
    },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <>
      {/* Emergency Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        title="Emergency Call"
        aria-label="Emergency Call"
      >
        <Phone className="w-8 h-8 animate-pulse" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
      </button>

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Emergency Contacts
                  </h3>
                  <p className="text-sm text-gray-600">
                    Quick access to emergency services
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Emergency Numbers */}
            <div className="space-y-3 mb-6">
              {emergencyNumbers.map((contact, index) => (
                <button
                  key={index}
                  onClick={() => handleCall(contact.number)}
                  className="w-full p-4 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-red-700 transition">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {contact.description}
                      </p>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {contact.number}
                      </p>
                    </div>
                    <Phone className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> For life-threatening emergencies,
                call 911 immediately. This app does not replace professional
                medical advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
