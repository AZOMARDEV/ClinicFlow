import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  DashboardStats,
  Paginated,
  Patient,
  PatientInput,
} from '@/lib/types';

export const keys = {
  patients: ['patients'] as const,
  patientList: (params: object) => ['patients', 'list', params] as const,
  patient: (id: string) => ['patients', 'detail', id] as const,
  appointments: ['appointments'] as const,
  appointmentList: (params: object) => ['appointments', 'list', params] as const,
  stats: ['dashboard', 'stats'] as const,
};

// ---------- patients ----------

export interface PatientListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: keys.patientList(params),
    queryFn: () => api<Paginated<Patient>>('/patients', { query: { ...params } }),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string) {
  return useQuery({ queryKey: keys.patient(id), queryFn: () => api<Patient>(`/patients/${id}`) });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.patients }),
      qc.invalidateQueries({ queryKey: keys.appointments }),
      qc.invalidateQueries({ queryKey: keys.stats }),
    ]);
}

export function useSavePatient() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PatientInput }) =>
      id ? api<Patient>(`/patients/${id}`, { method: 'PUT', body: input }) : api<Patient>('/patients', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/patients/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

// ---------- appointments ----------

export interface AppointmentListParams {
  date?: string;
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  patientId?: string;
}

export function useAppointments(params: AppointmentListParams, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: keys.appointmentList(params),
    queryFn: () => api<{ data: Appointment[] }>('/appointments', { query: { ...params } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: AppointmentInput) => api<Appointment>('/appointments', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateAppointmentStatus() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: invalidate,
  });
}

// ---------- dashboard ----------

export function useDashboardStats() {
  return useQuery({ queryKey: keys.stats, queryFn: () => api<DashboardStats>('/dashboard/stats') });
}
