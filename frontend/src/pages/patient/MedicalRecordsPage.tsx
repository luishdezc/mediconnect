import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import { recordApi } from '../../api';
import type { MedicalRecord, Pagination as Pag } from '../../types';
import styles from './MedicalRecordsPage.module.scss';

const MedicalRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [pagination, setPagination] = useState<Pag | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recordApi.getMy(page);
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Historial Médico</h1>
            <p>Tu expediente clínico digital completo</p>
          </div>
          {pagination && <span className={styles.count}>{pagination.total} registro{pagination.total !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div className={styles.list}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
        ) : records.length === 0 ? (
          <Card>
            <div className={styles.empty}>
              <FileText size={48} strokeWidth={1.2} />
              <h3>Sin expedientes</h3>
              <p>Tus registros médicos aparecerán aquí después de tus consultas.</p>
            </div>
          </Card>
        ) : (
          <div className={styles.list}>
            {records.map(rec => {
              const isOpen = expanded === rec._id;
              const docUser = (rec.doctorId?.userId as any);
              return (
                <Card key={rec._id} padding="none">
                  <button className={styles.recHeader} onClick={() => toggle(rec._id)}>
                    <div className={styles.recIcon}><FileText size={18} /></div>
                    <div className={styles.recMeta}>
                      <strong>{rec.diagnosis || 'Consulta médica'}</strong>
                      <span>Dr. {docUser?.name} • {format(parseISO(rec.createdAt), "d 'de' MMMM yyyy", { locale: es })}</span>
                    </div>
                    {rec.fileAttachments.length > 0 && (
                      <span className={styles.attachCount}>📎 {rec.fileAttachments.length}</span>
                    )}
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div className={styles.recBody}>
                      <div className={styles.recGrid}>
                        {rec.diagnosis && (
                          <div className={styles.recField}>
                            <label>Diagnóstico</label>
                            <p>{rec.diagnosis}</p>
                          </div>
                        )}
                        {rec.symptoms && rec.symptoms.length > 0 && (
                          <div className={styles.recField}>
                            <label>Síntomas</label>
                            <div className={styles.tags}>
                              {rec.symptoms.map(s => <span key={s} className={styles.tag}>{s}</span>)}
                            </div>
                          </div>
                        )}
                        {rec.treatment && (
                          <div className={styles.recField}>
                            <label>Tratamiento</label>
                            <p>{rec.treatment}</p>
                          </div>
                        )}
                        {rec.prescription && (
                          <div className={styles.recField}>
                            <label>Receta médica</label>
                            <p className={styles.prescription}>{rec.prescription}</p>
                          </div>
                        )}
                        {rec.notes && (
                          <div className={styles.recField}>
                            <label>Notas del médico</label>
                            <p>{rec.notes}</p>
                          </div>
                        )}
                        {rec.followUpDate && (
                          <div className={styles.recField}>
                            <label>Seguimiento</label>
                            <p>{format(parseISO(rec.followUpDate), "d 'de' MMMM yyyy", { locale: es })}</p>
                          </div>
                        )}
                      </div>

                      {rec.fileAttachments.length > 0 && (
                        <div className={styles.attachments}>
                          <label>Archivos adjuntos</label>
                          <div className={styles.attachList}>
                            {rec.fileAttachments.map((f, i) => (
                              <a key={i} href={f.url} target="_blank" rel="noreferrer" className={styles.attachItem}>
                                <Download size={14} />
                                <span>{f.filename}</span>
                                <span className={styles.attachSize}>{(f.size / 1024).toFixed(0)} KB</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>
    </DashboardLayout>
  );
};

export default MedicalRecordsPage;
