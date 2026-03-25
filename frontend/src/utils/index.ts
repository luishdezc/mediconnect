import { format, formatDistanceToNow, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: string | Date, pattern = "d 'de' MMMM yyyy"): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMM 'a las' HH:mm", { locale: es });
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d))    return `Hoy a las ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Mañana a las ${format(d, 'HH:mm')}`;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export const initials = (name: string): string =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

export const truncate = (text: string, len = 100): string =>
  text.length > len ? text.slice(0, len) + '…' : text;

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  in_progress: 'En consulta',
  completed:   'Completada',
  cancelled:   'Cancelada',
  no_show:     'No asistió',
};

export const APPOINTMENT_STATUS_COLOR: Record<string, string> = {
  pending:     '#f0b96a',
  confirmed:   '#1a6b5c',
  in_progress: '#2b6cb0',
  completed:   '#38a169',
  cancelled:   '#a0aec0',
  no_show:     '#e53e3e',
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^[\d\s\+\-\(\)]{7,15}$/.test(phone);

export const getApiError = (error: any): string =>
  error?.response?.data?.message || error?.message || 'Error inesperado';

export const DOW_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export const DOW_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
