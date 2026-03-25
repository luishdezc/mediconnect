import React, { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Link } from 'react-router-dom';
import { Calendar, FileText, MessageSquare, Stethoscope, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { appointmentApi, recordApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { Appointment, MedicalRecord } from '../../types';
import styles from './PatientDashboard.module.scss';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En consulta',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
};

const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, recRes] = await Promise.all([
          appointmentApi.getMy({ page: 1 }),
          recordApi.getMy(1),
        ]);
        setAppointments(apptRes.data.data);
        setRecords(recRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const upcoming = appointments.filter(a => !isPast(parseISO(a.appointmentDate)) && a.status !== 'cancelled');
  const todayAppts = appointments.filter(a => isToday(parseISO(a.appointmentDate)));
  const completed = appointments.filter(a => a.status === 'completed');

  if (loading) return (
    <DashboardLayout>
      <div className={styles.skeleton}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className={styles.page}>
        {}
        <div className={styles.header}>
          <div>
            <h1>Hola, {user?.name?.split(' ')[0]} 👋</h1>
            <p>{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
          <Link to="/patient/doctors">
            <Button icon={<Stethoscope size={16} />}>Buscar Doctor</Button>
          </Link>
        </div>

        {}
        {todayAppts.length > 0 && (
          <div className={styles.todayAlert}>
            <AlertCircle size={18} />
            <span>Tienes <strong>{todayAppts.length}</strong> cita{todayAppts.length > 1 ? 's' : ''} hoy.</span>
            <Link to="/patient/appointments">Ver detalles →</Link>
          </div>
        )}

        {}
        <div className={styles.stats}>
          <StatCard title="Citas Próximas"  value={upcoming.length}   icon={<Calendar size={22} />} color="green" />
          <StatCard title="Citas Hoy"        value={todayAppts.length} icon={<Clock size={22} />}    color="blue" />
          <StatCard title="Consultas Totales" value={completed.length} icon={<FileText size={22} />} color="amber" />
          <StatCard title="Expedientes"       value={records.length}   icon={<MessageSquare size={22} />} color="rose" />
        </div>

        <div className={styles.grid}>
          {}
          <Card>
            <div className={styles.sectionHeader}>
              <h3>Próximas Citas</h3>
              <Link to="/patient/appointments" className={styles.seeAll}>Ver todas <ChevronRight size={14} /></Link>
            </div>
            {upcoming.length === 0 ? (
              <div className={styles.empty}>
                <Calendar size={40} />
                <p>No tienes citas próximas</p>
                <Link to="/patient/doctors"><Button size="sm">Agendar cita</Button></Link>
              </div>
            ) : (
              <div className={styles.apptList}>
                {upcoming.slice(0, 4).map(appt => {
                  const doc = appt.doctorId;
                  const docUser = doc?.userId as any;
                  return (
                    <div key={appt._id} className={styles.apptItem}>
                      <div className={styles.apptAvatar}>
                        {docUser?.avatar ? <img src={resolveAvatar(docUser.avatar)} alt="" /> : <span>{docUser?.name?.[0]}</span>}
                      </div>
                      <div className={styles.apptInfo}>
                        <span className={styles.apptDoctor}>{docUser?.name}</span>
                        <span className={styles.apptSpec}>{doc?.specialization}</span>
                        <span className={styles.apptDate}>
                          {format(parseISO(appt.appointmentDate), "d MMM, HH:mm", { locale: es })}
                          {' • '}{appt.type === 'video' ? '📹 Videollamada' : '🏥 Presencial'}
                        </span>
                      </div>
                      <span className={`badge badge--${appt.status}`}>{STATUS_LABEL[appt.status]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {}
          <Card>
            <div className={styles.sectionHeader}>
              <h3>Expediente Reciente</h3>
              <Link to="/patient/records" className={styles.seeAll}>Ver todo <ChevronRight size={14} /></Link>
            </div>
            {records.length === 0 ? (
              <div className={styles.empty}>
                <FileText size={40} />
                <p>Sin expedientes aún</p>
              </div>
            ) : (
              <div className={styles.recordList}>
                {records.slice(0, 4).map(rec => {
                  const docUser = (rec.doctorId?.userId as any);
                  return (
                    <div key={rec._id} className={styles.recordItem}>
                      <div className={styles.recordIcon}><FileText size={16} /></div>
                      <div className={styles.recordInfo}>
                        <span className={styles.recordDiag}>{rec.diagnosis || 'Sin diagnóstico registrado'}</span>
                        <span className={styles.recordDoc}>Dr. {docUser?.name}</span>
                        <span className={styles.recordDate}>{format(parseISO(rec.createdAt), "d MMM yyyy", { locale: es })}</span>
                      </div>
                      {rec.fileAttachments.length > 0 && (
                        <span className={styles.attachBadge}>📎 {rec.fileAttachments.length}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {}
        <Card>
          <h3 className={styles.quickTitle}>Acciones Rápidas</h3>
          <div className={styles.quickActions}>
            {[
              { to: '/patient/doctors',     icon: '🔍', label: 'Buscar Doctor',      desc: 'Por especialidad o ubicación' },
              { to: '/patient/appointments', icon: '📅', label: 'Mis Citas',          desc: 'Ver y gestionar citas' },
              { to: '/patient/records',      icon: '📋', label: 'Historial Médico',   desc: 'Expedientes y recetas' },
              { to: '/patient/chat',         icon: '💬', label: 'Mensajes',           desc: 'Chatea con tu doctor' },
              { to: '/patient/medications',  icon: '💊', label: 'Medicamentos',        desc: 'Compara precios y farmacias' },
            ].map(a => (
              <Link key={a.to} to={a.to} className={styles.quickCard}>
                <span className={styles.quickIcon}>{a.icon}</span>
                <span className={styles.quickLabel}>{a.label}</span>
                <span className={styles.quickDesc}>{a.desc}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
