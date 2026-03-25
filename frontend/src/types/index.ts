export type UserRole = 'patient' | 'doctor' | 'admin';
export type AuthType = 'local' | 'google';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  authType: AuthType;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Patient {
  _id: string;
  userId: User;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistorySummary?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
}

export interface Doctor {
  _id: string;
  userId: User;
  specialization: string;
  licenseNumber: string;
  isVerified: boolean;
  isApproved: boolean;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  bio?: string;
  hourlyRate?: number;
  phone?: string;
  education?: string[];
  experience?: number;
  languages?: string[];
  rating: number;
  totalReviews: number;
  isSubscribed: boolean;
  isFeatured: boolean;
  subscriptionExpiresAt?: string;
}

export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  _id: string;
  patientId: Patient;
  doctorId: Doctor;
  appointmentDate: string;
  appointmentEndDate: string;
  status: AppointmentStatus;
  type: 'in_person' | 'video';
  reason?: string;
  notes?: string;
  videoRoomId?: string;
  createdAt: string;
}

export interface FileAttachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface MedicalRecord {
  _id: string;
  appointmentId: Appointment;
  patientId: string;
  doctorId: Doctor;
  diagnosis?: string;
  symptoms?: string[];
  treatment?: string;
  prescription?: string;
  notes?: string;
  followUpDate?: string;
  fileAttachments: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  patientId: Patient;
  doctorId: Doctor;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountPatient: number;
  unreadCountDoctor: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  pendingDoctors: number;
}
