import React, { useEffect, useState, useCallback } from 'react';
import { Search, FileText, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Modal } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { doctorApi, recordApi } from '../../api';
import type { Patient, MedicalRecord, Pagination as Pag } from '../../types';
import { resolveAvatar } from '../../utils/avatar';
import styles from './DoctorPatients.module.scss';

type PatientTab = 'info' | 'records';

const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<PatientTab>('info');
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [recPage, setRecPage] = useState(1);
  const [recPag, setRecPag] = useState<Pag | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getMyPatients(page);
      setPatients(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const loadRecords = async (patientId: string, p: number) => {
    setLoadingRecs(true);
    try {
      const res = await recordApi.getForPatient(patientId, p);
      setPatientRecords(res.data.data);
      setRecPag(res.data.pagination);
      setRecPage(p);
    } catch {}
    setLoadingRecs(false);
  };

  const openPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('info');
    setPatientRecords([]);
    setRecPage(1);
    setRecPag(null);
    loadRecords(patient._id, 1);
  };

  const filtered = patients.filter(p => {
    const u = p.userId as any;
    return !search
      || u?.name?.toLowerCase().includes(search.toLowerCase())
      || u?.email?.toLowerCase().includes(search.toLowerCase());
  });

  const genderLabel = (g?: string) =>
    g === 'male' ? 'Masculino' : g === 'female' ? 'Femenino' : g === 'other' ? 'Otro' : null;

  return (
    <DashboardLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Mis Pacientes</h1>
            <p>Pacientes que han tenido citas contigo</p>
          </div>
          {pagination && (
            <span className={styles.count}>
              {pagination.total} paciente{pagination.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Search */}
        <Card padding="sm">
          <Input
            placeholder="Buscar por nombre o correo…"
            icon={<Search size={15} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Card>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <span style={{ fontSize: 48 }}>👥</span>
              <h3>Sin pacientes</h3>
              <p>Los pacientes que te consulten aparecerán aquí.</p>
            </div>
          </Card>
        ) : (
          <>
            <div className={styles.grid}>
              {filtered.map(patient => {
                const u = patient.userId as any;
                return (
                  <Card key={patient._id} hover>
                    <div className={styles.patCard}>
                      <div className={styles.avatar}>
                        {resolveAvatar(u?.avatar)
                          ? <img src={resolveAvatar(u?.avatar)} alt="" />
                          : <span>{u?.name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className={styles.info}>
                        <strong>{u?.name}</strong>
                        <span>{u?.email}</span>
                        {patient.dateOfBirth && (
                          <span>🎂 {new Date(patient.dateOfBirth).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}</span>
                        )}
                        {patient.bloodType && <span>🩸 {patient.bloodType}</span>}
                      </div>
                      <div className={styles.cardActions}>
                        <Button size="sm" icon={<FileText size={14} />} onClick={() => openPatient(patient)}>
                          Ver
                        </Button>
                        <Link to="/doctor/chat">
                          <Button size="sm" variant="secondary" icon={<MessageSquare size={14} />}>
                            Chat
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* ── Patient detail modal ─────────────────────────────────── */}
      {selectedPatient && (() => {
        const u = selectedPatient.userId as any;
        return (
          <Modal
            isOpen
            onClose={() => setSelectedPatient(null)}
            title={`Paciente: ${u?.name}`}
            size="lg"
          >
            <div className={styles.modalBody}>

              {/* Tabs */}
              <div className={styles.tabs}>
                {([['info', '👤 Información'], ['records', '📋 Expedientes']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    className={[styles.tabBtn, activeTab === id ? styles['tabBtn--active'] : ''].join(' ')}
                    onClick={() => setActiveTab(id)}
                  >
                    {label} {id === 'records' && recPag ? `(${recPag.total})` : ''}
                  </button>
                ))}
              </div>

              {/* ── Info tab ─────────────────── */}
              {activeTab === 'info' && (
                <div className={styles.infoGrid}>
                  {[
                    ['📧 Correo',         u?.email],
                    ['🎂 Fecha de nac.',  selectedPatient.dateOfBirth
                      ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : null],
                    ['⚧ Género',         genderLabel(selectedPatient.gender)],
                    ['📞 Teléfono',       selectedPatient.phone],
                    ['🏠 Dirección',      selectedPatient.address],
                    ['🩸 Tipo de sangre', selectedPatient.bloodType],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label as string} className={styles.infoField}>
                      <label>{label}</label>
                      <span>{value}</span>
                    </div>
                  ))}

                  {(selectedPatient.allergies ?? []).length > 0 && (
                    <div className={styles.infoField} style={{ gridColumn: '1/-1' }}>
                      <label>⚠️ Alergias conocidas</label>
                      <div className={styles.tagRow}>
                        {selectedPatient.allergies!.map(a => (
                          <span key={a} className={styles.allergyTag}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.medicalHistorySummary && (
                    <div className={styles.infoField} style={{ gridColumn: '1/-1' }}>
                      <label>📝 Historial médico previo</label>
                      <p className={styles.infoText}>{selectedPatient.medicalHistorySummary}</p>
                    </div>
                  )}

                  {selectedPatient.emergencyContact?.name && (
                    <div className={styles.infoField} style={{ gridColumn: '1/-1' }}>
                      <label>🆘 Contacto de emergencia</label>
                      <span>
                        {selectedPatient.emergencyContact.name}
                        {selectedPatient.emergencyContact.relation && ` (${selectedPatient.emergencyContact.relation})`}
                        {selectedPatient.emergencyContact.phone && ` — ${selectedPatient.emergencyContact.phone}`}
                      </span>
                    </div>
                  )}

                  {!selectedPatient.dateOfBirth && !selectedPatient.phone &&
                   !selectedPatient.bloodType && !selectedPatient.medicalHistorySummary && (
                    <div className={styles.noInfoMsg} style={{ gridColumn: '1/-1' }}>
                      <span>📋</span>
                      <p>El paciente aún no ha completado su perfil médico.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Records tab ──────────────── */}
              {activeTab === 'records' && (
                <div className={styles.recordsTab}>
                  {loadingRecs ? (
                    <div className={styles.loadingRecs}>Cargando expedientes…</div>
                  ) : patientRecords.length === 0 ? (
                    <div className={styles.emptyRecs}>
                      <FileText size={40} strokeWidth={1.2} />
                      <p>Sin expedientes para este paciente.</p>
                    </div>
                  ) : (
                    <div className={styles.recList}>
                      {patientRecords.map(rec => (
                        <div key={rec._id} className={styles.recItem}>
                          <div className={styles.recHeader}>
                            <strong>{rec.diagnosis || 'Consulta médica'}</strong>
                            <span>{new Date(rec.createdAt).toLocaleDateString('es-MX', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}</span>
                          </div>
                          {(rec.symptoms ?? []).length > 0 && (
                            <div className={styles.recSymptoms}>
                              {rec.symptoms!.map(s => <span key={s} className={styles.symTag}>{s}</span>)}
                            </div>
                          )}
                          {rec.treatment   && <p className={styles.recDetail}><b>Tratamiento:</b> {rec.treatment}</p>}
                          {rec.prescription && <p className={styles.recDetail}><b>Receta:</b> {rec.prescription}</p>}
                          {rec.notes       && <p className={styles.recDetail}><b>Notas:</b> {rec.notes}</p>}
                          {rec.fileAttachments.length > 0 && (
                            <div className={styles.attachRow}>
                              {rec.fileAttachments.map((f, i) => (
                                <a key={i} href={f.url} target="_blank" rel="noreferrer" className={styles.attachLink}>
                                  📎 {f.filename}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {recPag && recPag.totalPages > 1 && (
                    <Pagination
                      pagination={{ ...recPag, page: recPage }}
                      onPageChange={p => loadRecords(selectedPatient._id, p)}
                    />
                  )}
                </div>
              )}

            </div>
          </Modal>
        );
      })()}
    </DashboardLayout>
  );
};

export default DoctorPatientsPage;