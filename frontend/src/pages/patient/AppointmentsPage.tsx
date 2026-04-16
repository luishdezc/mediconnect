import React, { useState, useEffect, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Video, Building2, X, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { appointmentApi } from '../../api';
import ReviewModal from '../../components/patient/ReviewModal';
import type { Appointment, Pagination as Pag } from '../../types';
import styles from './AppointmentsPage.module.scss';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En consulta',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
};
const STATUS_OPTS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMy({ page, status: status || undefined });
      setAppointments(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [status]);

  const cancel = async (id: string) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    setCancelling(id);
    try {
      await appointmentApi.updateStatus(id, 'cancelled');
      toast.success('Cita cancelada');
      fetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
    setCancelling(null);
  };

  return (
    <>
      <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Mis Citas</h1>
            <p>Gestiona todas tus consultas médicas</p>
          </div>
          <Link to="/patient/doctors">
            <Button icon={<Calendar size={16} />}>Nueva Cita</Button>
          </Link>
        </div>

        <Card padding="sm">
          <div className={styles.toolbar}>
            <Select options={STATUS_OPTS} value={status} onChange={e => setStatus(e.target.value)} />
            {pagination && <span className={styles.total}>{pagination.total} cita{pagination.total !== 1 ? 's' : ''}</span>}
          </div>
        </Card>

        {loading ? (
          <div className={styles.list}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />)}
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <Calendar size={48} strokeWidth={1.2} />
              <h3>Sin citas</h3>
              <p>No tienes citas{status ? ` con estado "${STATUS_LABEL[status]}"` : ''}.</p>
              <Link to="/patient/doctors"><Button size="sm">Buscar doctor</Button></Link>
            </div>
          </Card>
        ) : (
          <div className={styles.list}>
            {appointments.map(appt => {
              const doc = appt.doctorId;
              const docUser = doc?.userId as any;
              const date = parseISO(appt.appointmentDate);
              const canCancel = ['pending', 'confirmed'].includes(appt.status);

              return (
                <Card key={appt._id} padding="sm">
                  <div className={styles.apptRow}>
                    <div className={styles.dateBadge}>
                      <span className={styles.dateDay}>{format(date, 'd')}</span>
                      <span className={styles.dateMon}>{format(date, 'MMM', { locale: es })}</span>
                      <span className={styles.dateTime}>{format(date, 'HH:mm')}</span>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.docInfo}>
                      <div className={styles.docAvatar}>
                        {docUser?.avatar ? <img src={resolveAvatar(docUser.avatar)} alt="" /> : <span>{docUser?.name?.[0]}</span>}
                      </div>
                      <div>
                        <strong>{docUser?.name}</strong>
                        <span>{doc?.specialization}</span>
                        <span className={styles.reason}>{appt.reason || 'Sin motivo especificado'}</span>
                      </div>
                    </div>

                    <div className={styles.typePill}>
                      {appt.type === 'video' ? <><Video size={14} /> Videollamada</> : <><Building2 size={14} /> Presencial</>}
                    </div>

                    <span className={`badge badge--${appt.status}`}>{STATUS_LABEL[appt.status]}</span>

                    <div className={styles.actions}>
                      <Link to={`/patient/chat?doctorId=${(appt.doctorId as any)?._id || appt.doctorId}`}>
                        <Button size="sm" variant="secondary" icon={<MessageSquare size={14} />}>Chat</Button>
                      </Link>
                      {appt.type === 'video' && appt.status === 'confirmed' && (
                        <Link to="/patient/video">
                          <Button size="sm" icon={<Video size={14} />}>Videollamada</Button>
                        </Link>
                      )}
                      {appt.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Star size={14} />}
                          onClick={() => setReviewAppt(appt)}
                        >
                          Calificar
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm" variant="danger" icon={<X size={14} />}
                          loading={cancelling === appt._id}
                          onClick={() => cancel(appt._id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
      </DashboardLayout>

    {reviewAppt && (
        <ReviewModal
          appointment={reviewAppt}
          onClose={() => setReviewAppt(null)}
          onSuccess={() => { setReviewAppt(null); fetch(); }}
        />
      )}
    </>
  );
};

export default AppointmentsPage;
