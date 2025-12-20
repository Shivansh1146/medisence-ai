// Real-world TypeScript types for healthcare application

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  bloodGroup?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: string;
  severity?: "low" | "medium" | "high" | "critical";
  sentiment?: "positive" | "neutral" | "negative";
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: Date;
  time: string;
  type: "in-person" | "video" | "phone";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason: string;
  notes?: string;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience: number;
  rating: number;
  consultationFee: number;
  availableDays: string[];
  availableSlots: string[];
  image?: string;
}

export interface VitalRecord {
  id: string;
  userId: string;
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenLevel?: number;
  weight?: number;
  timestamp: Date;
}

export interface SymptomRecord {
  id: string;
  userId: string;
  symptoms: string;
  duration: string;
  severity: number;
  analysis?: string;
  recommendations?: string[];
  timestamp: Date;
}

export interface ImageAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  analysis: string;
  severity: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  requiresImmediate: boolean;
  timestamp: Date;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  instructions?: string;
}
