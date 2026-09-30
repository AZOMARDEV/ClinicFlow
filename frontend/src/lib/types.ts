export type UserRole = 'admin' | 'staff';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'cancelled'];

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  cin: string;
  phone: string;
  birthDate: string;
  address: string | null;
  createdAt: string;
}

export interface PatientInput {
  fullName: string;
  cin: string;
  phone: string;
  birthDate: string;
  address?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientCin: string;
  appointmentDate: string;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface AppointmentInput {
  patientId: string;
  appointmentDate: string;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pending: number;
  confirmed: number;
}
