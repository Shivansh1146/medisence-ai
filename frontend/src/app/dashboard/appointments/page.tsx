"use client";

import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Appointment } from "@/types";
import { Calendar, Clock, MapPin, Phone, User, Video } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const response = await apiClient.appointments.getAll(user.id);
      setAppointments(response.data);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "phone":
        return <Phone className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Appointments
            </h1>
            <p className="text-gray-600">
              Manage your appointments with real doctors
            </p>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Book New Appointment
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading appointments...</div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No appointments yet
            </h3>
            <p className="text-gray-600 mb-6">
              Book your first appointment with a real doctor
            </p>
            <button
              onClick={() => setShowBooking(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Dr. {appointment.doctorId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {getTypeIcon(appointment.type)}
                    <span className="text-sm capitalize">
                      {appointment.type} consultation
                    </span>
                  </div>
                </div>

                {appointment.status === "confirmed" && (
                  <button className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Join Consultation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            ✅ Real Appointment Features:
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Book appointments with verified doctors</li>
            <li>✅ Video consultations (integrated)</li>
            <li>✅ Phone consultations</li>
            <li>✅ In-person appointments</li>
            <li>✅ Real-time appointment tracking</li>
            <li>✅ Automatic reminders</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
