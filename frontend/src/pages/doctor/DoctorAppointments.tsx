import React, { useState, useEffect, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, CheckCircle, Video, Building2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import MedicalRecordModal from '../../components/doctor/MedicalRecordModal';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../api';
import type { Appointment, Pagination as Pag } from '../../types';
import styles from './DoctorAppointments.module.scss';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En consulta',
  completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
};

const STATUS_OPTS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'in_progress', label: 'En consulta' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  pending:     { label: 'Confirmar',    value: 'confirmed' },
  confirmed:   { label: 'Iniciar',      value: 'in_progress' },
  in_progress: { label: 'Completar',    value: 'completed' },
};

const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [recordAppt, setRecordAppt] = useState<Appointment | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMy({ page, status: statusFilter || undefined });
      setAppointments(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await appointmentApi.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: status as any } : a));
      toast.success('Estado actualizado');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
    setUpdating(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Mis Citas</h1>
            <p>Gestiona tu agenda y el estado de cada consulta</p>
          </div>
          {pagination && <span className={styles.total}>{pagination.total} cita{pagination.total !== 1 ? 's' : ''}</span>}
        </div>

        <Card padding="sm">
          <Select
            options={STATUS_OPTS}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </Card>

        {loading ? (
          <div className={styles.list}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <Clock size={48} strokeWidth={1.2} />
              <h3>Sin citas</h3>
              <p>No hay citas{statusFilter ? ` con estado "${STATUS_LABEL[statusFilter]}"` : ''}.</p>
            </div>
          </Card>
        ) : (
          <div className={styles.list}>
            {appointments.map(appt => {
              const patUser = (appt.patientId?.userId as any);
              const date = parseISO(appt.appointmentDate);
              const next = NEXT_STATUS[appt.status];

              return (
                <Card key={appt._id} padding="sm">
                  <div className={styles.row}>
                    {/* Date column */}
                    <div className={styles.dateBadge}>
                      <span className={styles.dateDay}>{format(date, 'd')}</span>
                      <span className={styles.dateMon}>{format(date, 'MMM', { locale: es })}</span>
                      <span className={styles.dateTime}>{format(date, 'HH:mm')}</span>
                    </div>

                    <div className={styles.divider} />

                    {/* Patient info */}
                    <div className={styles.patInfo}>
                      <div className={styles.avatar}>
                        {patUser?.avatar
                          ? <img src={resolveAvatar(patUser.avatar)} alt="" />
                          : <span>{patUser?.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <strong>{patUser?.name}</strong>
                        <span>{patUser?.email}</span>
                        {appt.reason && <span className={styles.reason}>"{appt.reason}"</span>}
                      </div>
                    </div>

                    {/* Type */}
                    <div className={styles.typePill}>
                      {appt.type === 'video'
                        ? <><Video size={13} /> Video</>
                        : <><Building2 size={13} /> Presencial</>
                      }
                    </div>

                    {/* Status */}
                    <span className={`badge badge--${appt.status}`}>{STATUS_LABEL[appt.status]}</span>

                    {/* Actions */}
                    <div className={styles.actions}>
                      {next && (
                        <Button
                          size="sm"
                          loading={updating === appt._id}
                          icon={<CheckCircle size={14} />}
                          onClick={() => updateStatus(appt._id, next.value)}
                        >
                          {next.label}
                        </Button>
                      )}
                      {appt.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<FileText size={14} />}
                          onClick={() => setRecordAppt(appt)}
                        >
                          Expediente
                        </Button>
                      )}
                      {appt.type === 'video' && appt.status === 'confirmed' && (
                        <Link to="/doctor/video">
                          <Button size="sm" icon={<Video size={14} />}>
                            Video
                          </Button>
                        </Link>
                      )}
                      {appt.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={updating === appt._id}
                          onClick={() => updateStatus(appt._id, 'cancelled')}
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

      {recordAppt && (
        <MedicalRecordModal
          appointment={recordAppt}
          onClose={() => setRecordAppt(null)}
          onSuccess={() => { setRecordAppt(null); toast.success('Expediente guardado'); }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorAppointmentsPage;