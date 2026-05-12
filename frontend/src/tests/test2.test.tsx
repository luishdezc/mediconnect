
import { describe, it, expect } from 'vitest';

import {
  formatTime,
  getApiError,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_COLOR,
} from '../utils/index';


describe('Prueba 6 – APPOINTMENT_STATUS_LABEL y COLOR', () => {
  const estados = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

  it('tiene etiqueta en español para cada estado del sistema', () => {
    estados.forEach(estado => {
      expect(APPOINTMENT_STATUS_LABEL[estado]).toBeDefined();
      expect(typeof APPOINTMENT_STATUS_LABEL[estado]).toBe('string');
      expect(APPOINTMENT_STATUS_LABEL[estado].length).toBeGreaterThan(0);
    });
  });

  it('tiene color HEX válido para cada estado', () => {
    estados.forEach(estado => {
      expect(APPOINTMENT_STATUS_COLOR[estado]).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    });
  });
});


describe('Prueba 7 – getApiError', () => {
  it('extrae el message de un error de respuesta Axios', () => {
    const axiosError = { response: { data: { message: 'Token inválido o expirado' } } };
    expect(getApiError(axiosError)).toBe('Token inválido o expirado');
  });

  it('cae al message del error si no hay response.data.message', () => {
    const genericError = { message: 'Network Error' };
    expect(getApiError(genericError)).toBe('Network Error');
  });

  it('devuelve texto genérico si el error está vacío o es null', () => {
    expect(getApiError(null)).toBe('Error inesperado');
    expect(getApiError({})).toBe('Error inesperado');
    expect(getApiError(undefined)).toBe('Error inesperado');
  });
});


describe('Prueba 8 – formatTime', () => {
  it('acepta un objeto Date y devuelve HH:mm en hora local', () => {
    const d = new Date(2024, 5, 10, 9, 5);
    expect(formatTime(d)).toBe('09:05');
  });

  it('devuelve siempre formato HH:mm (2 dígitos cada parte)', () => {
    const d = new Date(2024, 0, 1, 0, 0); 
    expect(formatTime(d)).toMatch(/^\d{2}:\d{2}$/);
  });
});


describe('Prueba 9 – authStore', () => {
  it('setToken guarda y limpia el token correctamente', async () => {
    const { useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();

    store.setToken('jwt-test-token-abc');
    expect(useAuthStore.getState().token).toBe('jwt-test-token-abc');

    store.setToken(null);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('setUser actualiza isAuthenticated y limpia al pasar null', async () => {
    const { useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();

    const fakeUser = { _id: '123', name: 'Ana López', email: 'ana@test.com', role: 'patient' as const };
    store.setUser(fakeUser as any);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Ana López');

    store.setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});


describe('Prueba 10 – Bloqueo de slots pasados', () => {
  const filterPastSlots = (
    slots: { time: string; available: boolean }[],
    isToday: boolean,
    now: Date,
  ) => {
    if (!isToday) return slots;
    return slots.map(s => {
      if (s.available && new Date(s.time).getTime() < now.getTime() + 5 * 60 * 1000) {
        return { ...s, available: false };
      }
      return s;
    });
  };

  it('deshabilita slots pasados cuando la fecha es hoy', () => {
    const now = new Date();
    const pasado = new Date(now.getTime() - 60 * 60 * 1000).toISOString();  
    const futuro = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const result = filterPastSlots(
      [{ time: pasado, available: true }, { time: futuro, available: true }],
      true, now
    );
    expect(result[0].available).toBe(false); 
    expect(result[1].available).toBe(true); 
  });

  it('NO deshabilita slots cuando la fecha es futura (no es hoy)', () => {
    const now = new Date();
    const ayer = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const result = filterPastSlots([{ time: ayer, available: true }], false, now);
    expect(result[0].available).toBe(true);
  });

  it('respeta slots ya marcados como no disponibles (ocupados)', () => {
    const now = new Date();
    const futuro = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const result = filterPastSlots([{ time: futuro, available: false }], true, now);
    expect(result[0].available).toBe(false); 
  });
});
