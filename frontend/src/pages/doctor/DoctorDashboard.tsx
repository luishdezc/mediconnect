import React, { useEffect, useState } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Link } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { appointmentApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { Appointment } from '../../types';
import styles from './DoctorDashboard.module.scss';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En consulta',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
};

const DoctorDashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi.getMy({ page: 1 })
      .then(r => setAppointments(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = appointments.filter(a => isToday(parseISO(a.appointmentDate)));
  const upcoming = appointments.filter(a => isFuture(parseISO(a.appointmentDate)) && !isToday(parseISO(a.appointmentDate)));
  const completed = appointments.filter(a => a.status === 'completed');
  const pending = appointments.filter(a => a.status === 'pending');

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Bienvenido, Dr. {user?.name?.split(' ')[0]} 👨‍⚕️</h1>
            <p>{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
          <Link to="/doctor/appointments">
            <Button icon={<Calendar size={16} />}>Ver Agenda</Button>
          </Link>
        </div>

        {/* Not approved warning */}
        {profile && !profile.isApproved && (
          <div className={styles.warningAlert}>
            <AlertTriangle size={18} />
            <div>
              <strong>Cuenta en revisión</strong>
              <p>Tu cuenta está siendo verificada por el administrador. Una vez aprobada, podrás recibir pacientes.</p>
            </div>
          </div>
        )}

        <div className={styles.stats}>
          <StatCard title="Citas Hoy"      value={today.length}    icon={<Clock size={22} />}        color="green" />
          <StatCard title="Próximas"        value={upcoming.length} icon={<Calendar size={22} />}     color="blue" />
          <StatCard title="Completadas"     value={completed.length} icon={<CheckCircle size={22} />} color="amber" />
          <StatCard title="Pendientes"      value={pending.length}  icon={<Users size={22} />}        color="rose" />
        </div>

        <div className={styles.grid}>
          {/* Today's schedule */}
          <Card>
            <div className={styles.sectionHeader}>
              <h3>Agenda de Hoy</h3>
              <Link to="/doctor/appointments" className={styles.seeAll}>Ver todas <ChevronRight size={14} /></Link>
            </div>
            {today.length === 0 ? (
              <div className={styles.empty}>
                <Calendar size={40} />
                <p>Sin citas programadas para hoy</p>
              </div>
            ) : (
              <div className={styles.scheduleList}>
                {today.map(appt => {
                  const pat = appt.patientId;
                  const patUser = pat?.userId as any;
                  return (
                    <div key={appt._id} className={styles.scheduleItem}>
                      <div className={styles.timeCol}>
                        <span>{format(parseISO(appt.appointmentDate), 'HH:mm')}</span>
                      </div>
                      <div className={styles.patAvatar}>
                        {patUser?.avatar ? <img src={resolveAvatar(patUser.avatar)} alt="" /> : <span>{patUser?.name?.[0]}</span>}
                      </div>
                      <div className={styles.patInfo}>
                        <strong>{patUser?.name}</strong>
                        <span>{appt.reason || 'Consulta general'}</span>
                      </div>
                      <span className={`badge badge--${appt.status}`}>{STATUS_LABEL[appt.status]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pending confirmations */}
          <Card>
            <div className={styles.sectionHeader}>
              <h3>Solicitudes Pendientes</h3>
              <span className={styles.pendingCount}>{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle size={40} />
                <p>Sin solicitudes pendientes</p>
              </div>
            ) : (
              <div className={styles.pendingList}>
                {pending.slice(0, 5).map(appt => {
                  const patUser = (appt.patientId?.userId as any);
                  return (
                    <div key={appt._id} className={styles.pendingItem}>
                      <div className={styles.patAvatar}>
                        {patUser?.avatar ? <img src={resolveAvatar(patUser.avatar)} alt="" /> : <span>{patUser?.name?.[0]}</span>}
                      </div>
                      <div className={styles.patInfo}>
                        <strong>{patUser?.name}</strong>
                        <span>{format(parseISO(appt.appointmentDate), "d MMM, HH:mm", { locale: es })}</span>
                      </div>
                      <div className={styles.pendingBtns}>
                        <Button size="sm" onClick={async () => {
                          await appointmentApi.updateStatus(appt._id, 'confirmed');
                          setAppointments(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'confirmed' } : a));
                        }}>Confirmar</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <h3 className={styles.quickTitle}>Herramientas</h3>
          <div className={styles.quickActions}>
            {[
              { to: '/doctor/appointments', icon: '📅', label: 'Mis Citas',        desc: 'Gestionar agenda' },
              { to: '/doctor/patients',     icon: '👥', label: 'Mis Pacientes',    desc: 'Ver expedientes' },
              { to: '/doctor/chat',         icon: '💬', label: 'Mensajes',         desc: 'Chat con pacientes' },
              { to: '/doctor/subscription', icon: '⭐', label: 'Suscripción',      desc: 'Planes premium' },
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

export default DoctorDashboard;
