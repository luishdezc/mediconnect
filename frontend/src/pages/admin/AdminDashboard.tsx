import React, { useEffect, useState, useCallback } from 'react';
import { resolveAvatar } from '../../utils/avatar';
import { Users, Stethoscope, Calendar, UserCheck, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, StatCard } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { adminApi } from '../../api';
import type { User, Doctor, DashboardStats, Pagination as Pag } from '../../types';
import AdminCharts from '../../components/admin/AdminChart';
import styles from './AdminDashboard.module.scss';

type AdminTab = 'overview' | 'users' | 'pending';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersPag, setUsersPag] = useState<Pag | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [pendingPag, setPendingPag] = useState<Pag | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [approving, setApproving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ page: usersPage, role: roleFilter || undefined, search: userSearch || undefined });
      setUsers(res.data.data);
      setUsersPag(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [usersPage, roleFilter, userSearch]);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingDoctors(pendingPage);
      setPendingDoctors(res.data.data);
      setPendingPag(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [pendingPage]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'pending') loadPending(); }, [tab, loadPending]);
  useEffect(() => { setUsersPage(1); }, [roleFilter, userSearch]);

  const handleApprove = async (id: string, approve: boolean) => {
    setApproving(id);
    try {
      await adminApi.approveDoctor(id, approve);
      toast.success(approve ? 'Doctor aprobado' : 'Doctor rechazado');
      loadPending();
      adminApi.getStats().then(r => setStats(r.data.stats));
    } catch { toast.error('Error'); }
    setApproving(null);
  };

  const handleToggleUser = async (id: string) => {
    try {
      const res = await adminApi.toggleUser(id);
      toast.success(res.data.message);
      loadUsers();
    } catch { toast.error('Error'); }
  };

  const ROLE_OPTS = [
    { value: '', label: 'Todos los roles' },
    { value: 'patient', label: 'Pacientes' },
    { value: 'doctor', label: 'Doctores' },
    { value: 'admin', label: 'Admins' },
  ];

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Panel de Administración</h1>
          <p>Gestión completa de la plataforma MediConnect</p>
        </div>

        <div className={styles.tabs}>
          {([['overview','Resumen'],['users','Usuarios'],['pending',`Aprobaciones${stats?.pendingDoctors ? ` (${stats.pendingDoctors})` : ''}`]] as const).map(([t, l]) => (
            <button key={t} className={[styles.tab, tab === t ? styles['tab--active'] : ''].join(' ')} onClick={() => setTab(t)}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <StatCard title="Total Usuarios"  value={stats?.totalUsers ?? '—'}       icon={<Users size={22} />}      color="green" />
              <StatCard title="Doctores"         value={stats?.totalDoctors ?? '—'}     icon={<Stethoscope size={22} />} color="blue" />
              <StatCard title="Pacientes"        value={stats?.totalPatients ?? '—'}    icon={<Users size={22} />}      color="amber" />
              <StatCard title="Total Citas"      value={stats?.totalAppointments ?? '—'} icon={<Calendar size={22} />} color="rose" />
            </div>
            {(stats?.pendingDoctors ?? 0) > 0 && (
              <div className={styles.pendingAlert}>
                <UserCheck size={18} />
                <span>Hay <strong>{stats!.pendingDoctors}</strong> doctor{stats!.pendingDoctors !== 1 ? 'es' : ''} esperando aprobación.</span>
                <Button size="sm" onClick={() => setTab('pending')}>Revisar ahora</Button>
              </div>
            )}
            <div className={styles.chartsRow}>
              <Card>
                <h3 className={styles.chartTitle}>Distribución de citas</h3>
                <AdminCharts />
              </Card>
              <Card>
                <h3 className={styles.chartTitle}>Actividad reciente</h3>
                <div className={styles.recentList}>
                  {stats && (
                    <div className={styles.activitySummary}>
                      <div className={styles.activityItem}>
                        <span className={styles.activityDot} style={{ background: '#1a6b5c' }}/>
                        <span>Plataforma activa con {stats.totalUsers} usuarios registrados</span>
                      </div>
                      <div className={styles.activityItem}>
                        <span className={styles.activityDot} style={{ background: '#2b6cb0' }}/>
                        <span>{stats.totalDoctors} doctores en el directorio</span>
                      </div>
                      <div className={styles.activityItem}>
                        <span className={styles.activityDot} style={{ background: '#f0b96a' }}/>
                        <span>{stats.pendingDoctors} solicitudes de doctor pendientes</span>
                      </div>
                      <div className={styles.activityItem}>
                        <span className={styles.activityDot} style={{ background: '#38a169' }}/>
                        <span>{stats.totalAppointments} citas agendadas en total</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className={styles.tableSection}>
            <Card padding="sm">
              <div className={styles.toolbar}>
                <Input placeholder="Buscar usuario…" icon={<Search size={15} />} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                <Select options={ROLE_OPTS} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} />
              </div>
            </Card>
            <Card padding="none">
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Usuario</th><th>Rol</th><th>Tipo</th><th>Registrado</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 20, width: '80%' }} /></td>)}</tr>
                      ))
                    ) : users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>{u.avatar ? <img src={resolveAvatar(u.avatar)} alt="" /> : <span>{u.name?.[0]}</span>}</div>
                            <div><strong>{u.name}</strong><span>{u.email}</span></div>
                          </div>
                        </td>
                        <td><span className={styles.roleBadge} data-role={u.role}>{u.role}</span></td>
                        <td>{u.authType === 'google' ? '🔵 Google' : '🔒 Local'}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
                        <td>
                          <span className={['badge', u.isActive ? 'badge--confirmed' : 'badge--cancelled'].join(' ')}>
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <Button size="sm" variant={u.isActive ? 'danger' : 'secondary'} onClick={() => handleToggleUser(u._id)}>
                            {u.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            {usersPag && <Pagination pagination={usersPag} onPageChange={setUsersPage} />}
          </div>
        )}

        {tab === 'pending' && (
          <div className={styles.tableSection}>
            {pendingDoctors.length === 0 && !loading ? (
              <Card>
                <div className={styles.empty}>
                  <UserCheck size={48} strokeWidth={1.2} />
                  <h3>Sin solicitudes pendientes</h3>
                  <p>Todos los doctores han sido revisados.</p>
                </div>
              </Card>
            ) : (
              <>
                <div className={styles.pendingList}>
                  {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)
                  ) : pendingDoctors.map(doc => {
                    const docUser = doc.userId as any;
                    return (
                      <Card key={doc._id} padding="sm">
                        <div className={styles.pendingRow}>
                          <div className={styles.pendingAvatar}>
                            {docUser?.avatar ? <img src={resolveAvatar(docUser.avatar)} alt="" /> : <span>{docUser?.name?.[0]}</span>}
                          </div>
                          <div className={styles.pendingInfo}>
                            <strong>{docUser?.name}</strong>
                            <span>📧 {docUser?.email}</span>
                            <span>🏥 {doc.specialization}</span>
                            <span>🪪 Cédula: {doc.licenseNumber}</span>
                          </div>
                          <div className={styles.pendingActions}>
                            <Button
                              size="sm" icon={<CheckCircle size={14} />}
                              loading={approving === doc._id}
                              onClick={() => handleApprove(doc._id, true)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm" variant="danger" icon={<XCircle size={14} />}
                              loading={approving === doc._id}
                              onClick={() => handleApprove(doc._id, false)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {pendingPag && <Pagination pagination={pendingPag} onPageChange={setPendingPage} />}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
