import React, { useEffect, useState, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import {
  ChevronLeft, ChevronRight, Calendar, Clock,
  Video, Building2, CheckCircle, User,
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { appointmentApi } from '../../api';
import type { Appointment } from '../../types';
import MedicalRecordModal from '../../components/doctor/MedicalRecordModal';
import styles from './DoctorCalendar.module.scss';

const STATUS_COLOR: Record<string, string> = {
  pending:     '#f0b96a',
  confirmed:   '#1a6b5c',
  in_progress: '#2b6cb0',
  completed:   '#38a169',
  cancelled:   '#a0aec0',
  no_show:     '#e53e3e',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En consulta',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
};
const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  pending:     { label: 'Confirmar',  value: 'confirmed' },
  confirmed:   { label: 'Iniciar',    value: 'in_progress' },
  in_progress: { label: 'Completar', value: 'completed' },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const DoctorCalendarPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setLoading]                   = useState(true);
  const [selected, setSelected]         = useState<Appointment | null>(null);
  const [recordAppt, setRecordAppt]     = useState<Appointment | null>(null);
  const [updating, setUpdating]         = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMy({ page: 1, limit: 100 } as any);
      setAppointments(res.data.data);
    } catch {}
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const getApptsByDay = (day: Date) =>
    appointments.filter(a => isSameDay(parseISO(a.appointmentDate), day))
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: status as any } : a));
      if (selected?._id === id) setSelected(prev => prev ? { ...prev, status: status as any } : null);
      toast.success('Estado actualizado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
    setUpdating(null);
  };

  const getSlotStyle = (appt: Appointment) => {
    const d = parseISO(appt.appointmentDate);
    const endD = new Date(d.getTime() + 30 * 60000);
    const startMin = d.getHours() * 60 + d.getMinutes();
    const endMin   = endD.getHours() * 60 + endD.getMinutes();
    const gridStart = HOURS[0] * 60;
    const gridEnd   = (HOURS[HOURS.length - 1] + 1) * 60;
    const total     = gridEnd - gridStart;
    const top       = ((startMin - gridStart) / total) * 100;
    const height    = ((endMin - startMin) / total) * 100;
    return { top: `${Math.max(0, top)}%`, height: `${Math.max(2, height)}%` };
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Calendario Semanal</h1>
            <p>
              {format(weekStart, "d 'de' MMMM", { locale: es })} –{' '}
              {format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          <div className={styles.navRow}>
            <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
              Hoy
            </Button>
            <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -7))}>
              <ChevronLeft size={18}/>
            </button>
            <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, 7))}>
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>

        <div className={styles.calLayout}>
          {/* Calendar grid */}
          <div className={styles.calWrap}>
            <Card padding="none">
              {/* Day headers */}
              <div className={styles.dayHeaders}>
                <div className={styles.timeGutter}/>
                {weekDays.map(day => (
                  <div
                    key={day.toISOString()}
                    className={[styles.dayHeader, isToday(day) ? styles['dayHeader--today'] : ''].join(' ')}
                  >
                    <span className={styles.dayName}>{format(day, 'EEE', { locale: es })}</span>
                    <span className={styles.dayNum}>{format(day, 'd')}</span>
                    {getApptsByDay(day).length > 0 && (
                      <span className={styles.dayCount}>{getApptsByDay(day).length}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className={styles.gridBody}>
                {/* Hour rows */}
                <div className={styles.hourRows}>
                  {HOURS.map(h => (
                    <div key={h} className={styles.hourRow}>
                      <div className={styles.hourLabel}>{String(h).padStart(2,'0')}:00</div>
                      <div className={styles.hourLine}/>
                    </div>
                  ))}
                </div>

                {/* Day columns with appointments */}
                <div className={styles.dayColumns}>
                  {weekDays.map(day => {
                    const dayAppts = getApptsByDay(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={[styles.dayColumn, isToday(day) ? styles['dayColumn--today'] : ''].join(' ')}
                      >
                        {dayAppts.map(appt => (
                          <button
                            key={appt._id}
                            className={[styles.apptBlock, selected?._id === appt._id ? styles['apptBlock--selected'] : ''].join(' ')}
                            style={{
                              ...getSlotStyle(appt),
                              borderLeftColor: STATUS_COLOR[appt.status] || '#1a6b5c',
                            }}
                            onClick={() => setSelected(a => a?._id === appt._id ? null : appt)}
                          >
                            <span className={styles.apptTime}>
                              {format(parseISO(appt.appointmentDate), 'HH:mm')}
                            </span>
                            <span className={styles.apptName}>
                              {(appt.patientId?.userId as any)?.name?.split(' ')[0]}
                            </span>
                            {appt.type === 'video' && <Video size={10}/>}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Detail panel */}
          <div className={styles.detailPanel}>
            {!selected ? (
              <Card>
                <div className={styles.noSelected}>
                  <Calendar size={36}/>
                  <p>Selecciona una cita para ver los detalles</p>
                </div>
              </Card>
            ) : (
              <Card padding="none">
                <div className={styles.detail}>
                  {/* Status bar */}
                  <div
                    className={styles.statusBar}
                    style={{ background: STATUS_COLOR[selected.status] }}
                  >
                    {STATUS_LABEL[selected.status]}
                  </div>

                  <div className={styles.detailBody}>
                    {/* Patient */}
                    <div className={styles.patRow}>
                      <div className={styles.patAvatar}>
                        {(selected.patientId?.userId as any)?.avatar
                          ? <img src={resolveAvatar((selected.patientId?.userId as any).avatar)} alt=""/>
                          : <span>{(selected.patientId?.userId as any)?.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <strong>{(selected.patientId?.userId as any)?.name}</strong>
                        <span>{(selected.patientId?.userId as any)?.email}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className={styles.detailFields}>
                      <div className={styles.detailField}>
                        <label><Clock size={12}/> Fecha y hora</label>
                        <span>
                          {format(parseISO(selected.appointmentDate), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </span>
                      </div>
                      <div className={styles.detailField}>
                        <label>{selected.type === 'video' ? <Video size={12}/> : <Building2 size={12}/>} Modalidad</label>
                        <span>{selected.type === 'video' ? 'Videollamada' : 'Presencial'}</span>
                      </div>
                      {selected.reason && (
                        <div className={styles.detailField}>
                          <label><User size={12}/> Motivo</label>
                          <span>"{selected.reason}"</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.detailActions}>
                      {NEXT_STATUS[selected.status] && (
                        <Button
                          fullWidth
                          icon={<CheckCircle size={14}/>}
                          loading={updating === selected._id}
                          onClick={() => updateStatus(selected._id, NEXT_STATUS[selected.status].value)}
                        >
                          {NEXT_STATUS[selected.status].label}
                        </Button>
                      )}
                      {selected.status === 'completed' && (
                        <Button
                          fullWidth
                          variant="secondary"
                          icon={<Calendar size={14}/>}
                          onClick={() => setRecordAppt(selected)}
                        >
                          Crear Expediente
                        </Button>
                      )}
                      {['pending','confirmed'].includes(selected.status) && (
                        <Button
                          fullWidth
                          variant="danger"
                          loading={updating === selected._id}
                          onClick={() => updateStatus(selected._id, 'cancelled')}
                        >
                          Cancelar Cita
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Week summary */}
            <Card>
              <h4 className={styles.summaryTitle}>Esta semana</h4>
              <div className={styles.summaryStats}>
                {[
                  { label: 'Total',      value: appointments.filter(a => weekDays.some(d => isSameDay(parseISO(a.appointmentDate), d))).length, color: '#1a6b5c' },
                  { label: 'Pendientes', value: appointments.filter(a => weekDays.some(d => isSameDay(parseISO(a.appointmentDate), d)) && a.status === 'pending').length, color: '#f0b96a' },
                  { label: 'Completadas',value: appointments.filter(a => weekDays.some(d => isSameDay(parseISO(a.appointmentDate), d)) && a.status === 'completed').length, color: '#38a169' },
                ].map(s => (
                  <div key={s.label} className={styles.summaryStat}>
                    <span style={{ color: s.color }}>{s.value}</span>
                    <label>{s.label}</label>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {recordAppt && (
        <MedicalRecordModal
          appointment={recordAppt}
          onClose={() => setRecordAppt(null)}
          onSuccess={() => { setRecordAppt(null); toast.success('Expediente guardado'); fetchWeek(); }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorCalendarPage;