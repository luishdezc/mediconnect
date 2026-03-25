import { useState, useEffect, useCallback } from 'react';
import { appointmentApi, doctorApi, recordApi, adminApi } from '../api';
import type { Appointment, Doctor, MedicalRecord, Pagination } from '../types';

function usePaginated<T>(
  fetcher: (page: number, params?: any) => Promise<any>,
  params?: any,
  initialPage = 1
) {
  const [data, setData]             = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(initialPage);

  const fetch = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(p, params);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [page, JSON.stringify(params)]);

  useEffect(() => { fetch(page); }, [page, JSON.stringify(params)]);

  return { data, pagination, loading, error, page, setPage, refetch: () => fetch(page) };
}

export function useMyAppointments(params?: { status?: string }) {
  return usePaginated<Appointment>(
    (page) => appointmentApi.getMy({ page, ...params }),
    params
  );
}

export function useDoctors(params?: {
  search?: string;
  specialization?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  return usePaginated<Doctor>(
    (page) => doctorApi.getAll({ page, ...params }),
    params
  );
}

export function useMyRecords() {
  return usePaginated<MedicalRecord>(
    (page) => recordApi.getMy(page)
  );
}

export function usePatientRecords(patientId: string | undefined) {
  const [data, setData]             = useState<MedicalRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const fetch = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await recordApi.getForPatient(patientId, page);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [patientId, page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, pagination, loading, page, setPage, refetch: fetch };
}

export function useAdminUsers(params?: { role?: string; search?: string }) {
  return usePaginated(
    (page) => adminApi.getUsers({ page, ...params }),
    params
  );
}

export function useAdminPendingDoctors() {
  return usePaginated(
    (page) => adminApi.getPendingDoctors(page)
  );
}

export function useSpecializations() {
  const [data, setData]     = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi.getSpecializations()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useAvailableSlots(doctorId: string, date: string | null) {
  const [slots, setSlots]   = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !doctorId) { setSlots([]); return; }
    setLoading(true);
    appointmentApi.getSlots(doctorId, date)
      .then(r => setSlots(r.data.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  return { slots, loading };
}
